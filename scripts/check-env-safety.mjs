import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();

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

const PLACEHOLDER_SAFE_FILES = new Set([
  ".env.example",
  ".env.test.example",
]);

const PLACEHOLDER_SAFE_PREFIXES = [
  "docs/security/",
  "docs/templates/",
];

const BANNED_FILES = [".env", ".env.local", ".env.production"];

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function isPlaceholderSafeFile(rel) {
  if (PLACEHOLDER_SAFE_FILES.has(rel)) return true;
  if (PLACEHOLDER_SAFE_PREFIXES.some((p) => rel.startsWith(p))) return true;
  return false;
}

let violations = 0;

for (const banned of BANNED_FILES) {
  if (existsSync(join(ROOT, banned))) {
    console.error(`ENV_SAFETY_VIOLATION: tracked file "${banned}" exists`);
    violations++;
  }
}

const allFiles = walk(ROOT);
for (const fp of allFiles) {
  const rel = relative(ROOT, fp).replace(/\\/g, "/");
  if (rel.startsWith("scripts/")) continue;
  if (rel.startsWith("docs/")) continue;

  let content;
  try {
    content = readFileSync(fp, "utf-8");
  } catch {
    continue;
  }

  for (const secret of BLOCKED_SECRETS) {
    if (content.includes(secret)) {
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(secret)) {
          const trimmed = lines[i].trim();
          if (
            trimmed.startsWith("//") ||
            trimmed.startsWith("#") ||
            trimmed.startsWith("*")
          )
            continue;

          if (isPlaceholderSafeFile(rel)) {
            if (
              trimmed.includes("placeholder") ||
              trimmed.includes("PLACEHOLDER") ||
              trimmed.includes("example") ||
              trimmed.includes("EXAMPLE") ||
              /=\s*["']?\s*$/.test(trimmed) ||
              /=\s*["']?your[-_]/.test(trimmed)
            )
              continue;
          }

          if (
            /=\s*["']?\s*$/.test(trimmed) ||
            /=\s*["']?your[-_]/.test(trimmed)
          )
            continue;

          console.error(
            `ENV_SECRET_VIOLATION: "${secret}" in ${rel}:${i + 1}`
          );
          violations++;
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-env-safety: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_ENV_SAFETY_PASS");
