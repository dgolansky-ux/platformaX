import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative, basename, extname } from "path";

const ROOT = process.cwd();

const SECRET_PATTERNS = [
  { pattern: /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["']?[A-Za-z0-9.+/=_-]{10,}/, label: "SUPABASE_SERVICE_ROLE_KEY" },
  { pattern: /DATABASE_URL\s*[:=]\s*["']?postgresql:\/\/[^\s"']+/, label: "DATABASE_URL" },
  { pattern: /postgresql:\/\/[^"'\s]*:[^"'\s]*@/, label: "PostgreSQL connection string" },
  { pattern: /JWT_SECRET\s*[:=]\s*["']?[A-Za-z0-9.+/=_-]{10,}/, label: "JWT_SECRET" },
  { pattern: /OPENAI_API_KEY\s*[:=]\s*["']?sk-[A-Za-z0-9_-]{10,}/, label: "OPENAI_API_KEY" },
  { pattern: /sk-live[_-][A-Za-z0-9]{10,}/, label: "Stripe live key (sk-live)" },
  { pattern: /sk_test[_-][A-Za-z0-9]{10,}/, label: "Stripe test key (sk_test)" },
  { pattern: /sk-[A-Za-z0-9]{32,}/, label: "OpenAI-style key (sk-)" },
  { pattern: /service_role\s*[:=]\s*["']?eyJ[A-Za-z0-9._-]{20,}/, label: "service_role JWT" },
  { pattern: /private_key\s*[:=]\s*["']?-----BEGIN/, label: "private_key PEM" },
  { pattern: /access_token\s*[:=]\s*["']?[A-Za-z0-9._-]{20,}/, label: "access_token" },
  { pattern: /refresh_token\s*[:=]\s*["']?[A-Za-z0-9._-]{20,}/, label: "refresh_token" },
  { pattern: /eyJhbGciOi[A-Za-z0-9_-]{40,}/, label: "JWT token literal" },
  { pattern: /AKIA[A-Z0-9]{16}/, label: "AWS access key" },
  { pattern: /ghp_[A-Za-z0-9]{36,}/, label: "GitHub PAT" },
  { pattern: /gho_[A-Za-z0-9]{36,}/, label: "GitHub OAuth token" },
  { pattern: /xoxb-[0-9]{10,}-[A-Za-z0-9]{20,}/, label: "Slack bot token" },
  { pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, label: "Private key block" },
  { pattern: /sbp_[A-Za-z0-9]{40,}/, label: "Supabase personal key" },
];

const BANNED_TRACKED_FILES = [".env", ".env.local", ".env.production"];

const SKIP_DIRS = new Set([
  "node_modules", "dist", "build", "coverage", ".git", ".cache", ".turbo",
]);

const SKIP_EXTENSIONS = new Set([
  ".lock", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg",
  ".woff", ".woff2", ".ttf", ".eot", ".zip", ".tar", ".gz",
]);

const PLACEHOLDER_SAFE_FILES = new Set([
  ".env.example",
  ".env.test.example",
]);

const PLACEHOLDER_SAFE_PREFIXES = [
  "docs/security/",
  "docs/templates/",
];

const GUARD_SCRIPT_PREFIXES = [
  "scripts/check-",
  "scripts/rules-",
  "scripts/arch-",
  "scripts/validate-",
  "scripts/audit-",
  "scripts/no-commit-",
];

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function isPlaceholderSafe(rel) {
  if (PLACEHOLDER_SAFE_FILES.has(rel)) return true;
  if (PLACEHOLDER_SAFE_PREFIXES.some((p) => rel.startsWith(p))) return true;
  // Sample/example config files (.env.example, .claude/settings.example.json,
  // .env.test.example, …) document variable NAMES with placeholder values.
  // This only suppresses placeholder-LOOKING lines (see the caller) — a real
  // secret value that does not look like a placeholder is still flagged.
  if (/\.example(\.[a-z0-9]+)?$/i.test(rel)) return true;
  return false;
}

function isGuardScript(rel) {
  if (GUARD_SCRIPT_PREFIXES.some((p) => rel.startsWith(p))) return true;
  if (rel.startsWith("scripts/__tests__/")) return true;
  return false;
}

function isCommentLine(line) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("<!--")
  );
}

function looksLikePlaceholder(line) {
  const lower = line.toLowerCase();
  return (
    lower.includes("placeholder") ||
    lower.includes("example") ||
    lower.includes("your-") ||
    lower.includes("your_") ||
    lower.includes("xxx") ||
    lower.includes("changeme") ||
    lower.includes("replace-") ||
    /[:=]\s*["']?\s*$/.test(line.trim())
  );
}

function maskValue(line) {
  return line
    .replace(/([:=]\s*["']?)([^\s"']{4})[^\s"']*/g, "$1$2****")
    .substring(0, 120);
}

function isReviewReport(rel) {
  return rel.startsWith("docs/review/") && rel.endsWith(".md");
}

let violations = 0;
const findings = [];

for (const banned of BANNED_TRACKED_FILES) {
  const full = join(ROOT, banned);
  if (existsSync(full)) {
    findings.push({
      type: "TRACKED_ENV_FILE",
      file: banned,
      line: 0,
      detail: `Tracked ${banned} file must not exist in repository`,
    });
    violations++;
  }
}

const allFiles = walk(ROOT);

for (const fp of allFiles) {
  const rel = relative(ROOT, fp).replace(/\\/g, "/");
  const ext = extname(rel);
  const base = basename(rel);

  if (SKIP_EXTENSIONS.has(ext)) continue;
  if (rel === "pnpm-lock.yaml") continue;
  if (isGuardScript(rel)) continue;
  if (isReviewReport(rel)) continue;

  let content;
  try {
    content = readFileSync(fp, "utf-8");
  } catch {
    continue;
  }

  const lines = content.split("\n");

  for (const { pattern, label } of SECRET_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (!pattern.test(lines[i])) continue;

      if (isCommentLine(lines[i])) continue;

      if (isPlaceholderSafe(rel) && looksLikePlaceholder(lines[i])) continue;

      if (looksLikePlaceholder(lines[i])) continue;

      findings.push({
        type: label,
        file: rel,
        line: i + 1,
        detail: maskValue(lines[i].trim()),
      });
      violations++;
    }
  }
}

if (findings.length > 0) {
  console.error("SECRET_SCAN_VIOLATIONS:\n");
  for (const f of findings) {
    console.error(`  [${f.type}] ${f.file}:${f.line}`);
    console.error(`    ${f.detail}\n`);
  }
  console.error(`check-secret-scan: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_SECRET_SCAN_PASS");
