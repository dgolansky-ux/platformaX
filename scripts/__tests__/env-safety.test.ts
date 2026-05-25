import { describe, it, expect } from "vitest";

const BLOCKED_SECRETS = [
  "DATABASE_URL=",
  "postgresql://",
  "SUPABASE_SERVICE_ROLE_KEY=",
  "service_role",
  "JWT_SECRET=",
  "OPENAI_API_KEY=",
  "sk_live",
  "sk_test",
];

function detectSecret(line: string): string | null {
  const trimmed = line.trim();
  if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) return null;
  if (trimmed.includes("placeholder") || trimmed.includes("PLACEHOLDER")) return null;
  if (/=\s*["']?\s*$/.test(trimmed)) return null;

  for (const secret of BLOCKED_SECRETS) {
    if (line.includes(secret)) return secret;
  }
  return null;
}

describe("env-safety: secret detection", () => {
  it("detects real DATABASE_URL", () => {
    expect(detectSecret("DATABASE_URL=postgres://user:pass@host/db")).toBe("DATABASE_URL=");
  });

  it("detects service_role key", () => {
    expect(detectSecret('const key = "service_role_abc123"')).toBe("service_role");
  });

  it("skips comments", () => {
    expect(detectSecret("// DATABASE_URL=something")).toBeNull();
    expect(detectSecret("# OPENAI_API_KEY=sk-abc")).toBeNull();
  });

  it("skips placeholders", () => {
    expect(detectSecret("DATABASE_URL=placeholder")).toBeNull();
  });

  it("skips empty values", () => {
    expect(detectSecret("DATABASE_URL=")).toBeNull();
    expect(detectSecret('DATABASE_URL= ')).toBeNull();
  });

  it("detects sk_live keys", () => {
    expect(detectSecret('stripe_key = "sk_live_abc123"')).toBe("sk_live");
  });
});
