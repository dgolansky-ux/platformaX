import { describe, it, expect } from "vitest";

const SECRET_PATTERNS = [
  { pattern: /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["']?[A-Za-z0-9.+/=_-]{10,}/, label: "SUPABASE_SERVICE_ROLE_KEY" },
  { pattern: /DATABASE_URL\s*[:=]\s*["']?postgresql:\/\/[^\s"']+/, label: "DATABASE_URL" },
  { pattern: /postgresql:\/\/[^"'\s]*:[^"'\s]*@/, label: "PostgreSQL connection string" },
  { pattern: /OPENAI_API_KEY\s*[:=]\s*["']?sk-[A-Za-z0-9_-]{10,}/, label: "OPENAI_API_KEY" },
  { pattern: /sk_test[_-][A-Za-z0-9]{10,}/, label: "Stripe test key (sk_test)" },
  { pattern: /sk-live[_-][A-Za-z0-9]{10,}/, label: "Stripe live key (sk-live)" },
  { pattern: /sk-[A-Za-z0-9]{32,}/, label: "OpenAI-style key (sk-)" },
  { pattern: /service_role\s*[:=]\s*["']?eyJ[A-Za-z0-9._-]{20,}/, label: "service_role JWT" },
  { pattern: /access_token\s*[:=]\s*["']?[A-Za-z0-9._-]{20,}/, label: "access_token" },
  { pattern: /refresh_token\s*[:=]\s*["']?[A-Za-z0-9._-]{20,}/, label: "refresh_token" },
  { pattern: /eyJhbGciOi[A-Za-z0-9_-]{40,}/, label: "JWT token literal" },
  { pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, label: "Private key block" },
];

function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*") || trimmed.startsWith("<!--");
}

function looksLikePlaceholder(line: string): boolean {
  const lower = line.toLowerCase();
  return lower.includes("placeholder") || lower.includes("example") || lower.includes("your-") || lower.includes("your_") || lower.includes("xxx") || lower.includes("changeme") || /[:=]\s*["']?\s*$/.test(line.trim());
}

function maskValue(line: string): string {
  return line.replace(/([:=]\s*["']?)([^\s"']{4})[^\s"']*/g, "$1$2****").substring(0, 120);
}

interface Finding { type: string; file: string; line: number; detail: string }

function scanLine(line: string, rel: string, lineNum: number, isPlaceholderSafe: boolean): Finding[] {
  const results: Finding[] = [];
  if (isCommentLine(line)) return results;

  for (const { pattern, label } of SECRET_PATTERNS) {
    if (!pattern.test(line)) continue;
    if (isPlaceholderSafe && looksLikePlaceholder(line)) continue;
    if (looksLikePlaceholder(line)) continue;
    results.push({ type: label, file: rel, line: lineNum, detail: maskValue(line.trim()) });
  }
  return results;
}

describe("secret-scan: real DATABASE_URL in source = FAIL", () => {
  it("detects postgresql connection string", () => {
    const findings = scanLine('DATABASE_URL=postgresql://user:pass@host:5432/mydb', "server/config.ts", 1, false);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.type === "DATABASE_URL")).toBe(true);
  });

  it("detects postgresql:// with credentials", () => {
    const findings = scanLine('const db = "postgresql://admin:secret123@prod.host/app"', "server/db.ts", 5, false);
    expect(findings.some(f => f.type === "PostgreSQL connection string")).toBe(true);
  });
});

describe("secret-scan: SUPABASE_SERVICE_ROLE_KEY in source = FAIL", () => {
  it("detects service role key assignment", () => {
    const findings = scanLine('SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', "server/config.ts", 1, false); // gitleaks:allow — fake JWT header used to exercise our scanner
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.type === "SUPABASE_SERVICE_ROLE_KEY")).toBe(true);
  });
});

describe("secret-scan: OPENAI_API_KEY in source = FAIL", () => {
  it("detects OpenAI key", () => {
    const findings = scanLine('OPENAI_API_KEY=sk-abcdefgh1234567890', "server/ai.ts", 3, false); // gitleaks:allow — fake fixture string used to exercise our scanner
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.type === "OPENAI_API_KEY")).toBe(true);
  });
});

describe("secret-scan: sk_test pattern in source = FAIL", () => {
  it("detects Stripe test key", () => {
    const findings = scanLine('const stripe = "sk_test_abcdefghij1234567890"', "server/payments.ts", 10, false); // gitleaks:allow — fake fixture string used to exercise our scanner
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.type === "Stripe test key (sk_test)")).toBe(true);
  });
});

describe("secret-scan: placeholder in .env.example = PASS", () => {
  it("allows placeholder values in safe files", () => {
    const findings = scanLine('DATABASE_URL=postgresql://your-host/example-db', ".env.example", 1, true);
    expect(findings.length).toBe(0);
  });

  it("allows empty assignments", () => {
    const findings = scanLine('OPENAI_API_KEY=', ".env.example", 2, true);
    expect(findings.length).toBe(0);
  });

  it("allows changeme values in safe files", () => {
    const findings = scanLine('SUPABASE_SERVICE_ROLE_KEY=changeme-placeholder', ".env.example", 3, true);
    expect(findings.length).toBe(0);
  });
});

describe("secret-scan: safe patterns", () => {
  it("skips comment lines", () => {
    const findings = scanLine('// OPENAI_API_KEY=sk-realkey1234567890', "server/config.ts", 1, false);
    expect(findings.length).toBe(0);
  });

  it("skips hash comments", () => {
    const findings = scanLine('# DATABASE_URL=postgresql://user:pass@host/db', ".env.example", 1, false);
    expect(findings.length).toBe(0);
  });

  it("skips markdown comments", () => {
    const findings = scanLine('<!-- access_token=abc1234567890abcdef1234 -->', "README.md", 1, false); // gitleaks:allow — fake fixture string used to exercise our scanner
    expect(findings.length).toBe(0);
  });

  it("skips placeholder-looking values everywhere", () => {
    const findings = scanLine('DATABASE_URL=postgresql://your-host/example-db', "server/config.ts", 1, false);
    expect(findings.length).toBe(0);
  });
});

describe("secret-scan: scanner masks values in output", () => {
  it("masks secret values in detail field", () => {
    const findings = scanLine('DATABASE_URL=postgresql://user:supersecret@host:5432/db', "config.ts", 1, false);
    expect(findings.length).toBeGreaterThan(0);
    for (const f of findings) {
      expect(f.detail).not.toContain("supersecret");
      expect(f.detail).toContain("****");
    }
  });

  it("masks JWT tokens", () => {
    const findings = scanLine('SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.something.secret', "config.ts", 1, false);
    expect(findings.length).toBeGreaterThan(0);
    for (const f of findings) {
      expect(f.detail).toContain("****");
    }
  });
});

describe("secret-scan: additional patterns", () => {
  it("detects JWT token literals", () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9abcdefghijklmnopqrstuvwxyz1234567890";
    const findings = scanLine(`const token = "${jwt}"`, "server/auth.ts", 1, false);
    expect(findings.some(f => f.type === "JWT token literal")).toBe(true);
  });

  it("detects private key blocks", () => {
    const findings = scanLine('-----BEGIN RSA PRIVATE KEY-----', "server/certs.ts", 1, false);
    expect(findings.some(f => f.type === "Private key block")).toBe(true);
  });

  it("detects service_role JWT assignment", () => {
    const findings = scanLine('service_role = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9abcdefghijklmno"', "server/supabase.ts", 1, false);
    expect(findings.some(f => f.type === "service_role JWT")).toBe(true);
  });
});
