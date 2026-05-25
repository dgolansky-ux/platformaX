import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();

const SECRET_PATTERNS = [
  { pattern: /sk_live_[A-Za-z0-9]{20,}/, label: "Stripe live key" },
  { pattern: /sk_test_[A-Za-z0-9]{20,}/, label: "Stripe test key" },
  { pattern: /ghp_[A-Za-z0-9]{36,}/, label: "GitHub PAT" },
  { pattern: /gho_[A-Za-z0-9]{36,}/, label: "GitHub OAuth" },
  { pattern: /github_pat_[A-Za-z0-9_]{20,}/, label: "GitHub fine-grained PAT" },
  { pattern: /eyJhbGciOi[A-Za-z0-9_-]{40,}/, label: "JWT token" },
  { pattern: /AKIA[A-Z0-9]{16}/, label: "AWS access key" },
  { pattern: /sk-[A-Za-z0-9]{32,}/, label: "OpenAI API key" },
  { pattern: /xoxb-[0-9]{10,}-[A-Za-z0-9]{20,}/, label: "Slack bot token" },
  { pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, label: "Private key" },
  { pattern: /sbp_[A-Za-z0-9]{40,}/, label: "Supabase service key" },
  { pattern: /supabase_service_role_key\s*[:=]\s*["'][A-Za-z0-9.+/=]{30,}/, label: "Supabase service role" },
  { pattern: /postgresql:\/\/[^"'\s]+:[^"'\s]+@/, label: "PostgreSQL connection with credentials" },
];

const SAFE_FILES = new Set([
  ".env.example",
  ".env.test.example",
  "docs/security/SECRET_HANDLING_POLICY.md",
]);

const SAFE_PREFIXES = ["scripts/check-", "scripts/rules-", "scripts/arch-", "scripts/validate-", "scripts/audit-", "scripts/no-commit-"];
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "coverage", ".cache", ".turbo"]);
const SKIP_EXTENSIONS = new Set([".lock", ".png", ".jpg", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".eot"]);

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

let violations = 0;
const files = walk(ROOT);

for (const fp of files) {
  const rel = relative(ROOT, fp).replace(/\\/g, "/");
  if (SAFE_FILES.has(rel)) continue;
  if (SAFE_PREFIXES.some(p => rel.startsWith(p))) continue;
  if (rel.startsWith("scripts/__tests__/")) continue;
  const ext = rel.substring(rel.lastIndexOf("."));
  if (SKIP_EXTENSIONS.has(ext)) continue;
  if (rel === "pnpm-lock.yaml") continue;

  let content;
  try { content = readFileSync(fp, "utf-8"); } catch { continue; }

  for (const { pattern, label } of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          const trimmed = lines[i].trim();
          if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) continue;
          if (trimmed.includes("example") || trimmed.includes("EXAMPLE") || trimmed.includes("placeholder")) continue;
          console.error(`SECRET_SCAN_VIOLATION: ${label} in ${rel}:${i + 1}`);
          violations++;
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-local-secret-scan: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_LOCAL_SECRET_SCAN_PASS");
