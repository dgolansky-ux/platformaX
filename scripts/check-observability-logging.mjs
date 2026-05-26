import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
const SCAN_DIRS = ["server/domains-v2", "client/src/features-v2", "client/src/app-v2"];

const PII_LOG_PATTERNS = [
  { pattern: /\b(email|e-mail)\b/i, field: "email" },
  { pattern: /\bphone\b/i, field: "phone" },
  { pattern: /\bdateOfBirth\b/i, field: "dateOfBirth" },
  { pattern: /\btoken\b/i, field: "token" },
  { pattern: /\bsession\b/i, field: "session" },
  { pattern: /\bservice_role\b/i, field: "service_role" },
  { pattern: /\bDATABASE_URL\b/, field: "DATABASE_URL" },
  { pattern: /\bpassword\b/i, field: "password" },
  { pattern: /\bsecret\b/i, field: "secret" },
];

const CONSOLE_PATTERNS = [
  /console\.log\s*\(/,
  /console\.debug\s*\(/,
];

const EXCEPTION_MARKER = "LOGGING_EXCEPTION:";
const ALLOWED_MARKER = "ALLOW_CONSOLE:";

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "coverage", "__tests__"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function isTestFile(rel) {
  return /\.(test|spec|fixture)\./.test(rel) || rel.includes("__tests__/") || rel.includes("fixtures");
}

function isScriptFile(rel) {
  return rel.startsWith("scripts/");
}

let violations = 0;

for (const scanDir of SCAN_DIRS) {
  const absDir = join(ROOT, scanDir);
  const files = walk(absDir);

  for (const fp of files) {
    if (!/\.(ts|tsx|js|mjs)$/.test(fp)) continue;
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    if (isTestFile(rel) || isScriptFile(rel)) continue;

    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }
    if (content.includes(ALLOWED_MARKER)) continue;

    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

      for (const consolePat of CONSOLE_PATTERNS) {
        if (consolePat.test(line)) {
          let hasException = false;
          for (let j = Math.max(0, i - 2); j <= i; j++) {
            if (lines[j] && (lines[j].includes(EXCEPTION_MARKER) || lines[j].includes(ALLOWED_MARKER))) {
              hasException = true;
              break;
            }
          }
          if (!hasException) {
            console.error(`LOGGING_VIOLATION: ${rel}:${i + 1} — unsafe console logging in runtime code`);
            violations++;
          }
        }
      }

      if (/console\.(log|error|warn|info|debug)\s*\(/.test(line) || /logger\.(log|error|warn|info|debug)\s*\(/.test(line)) {
        const logContext = lines.slice(i, Math.min(lines.length, i + 3)).join(" ");
        for (const { pattern, field } of PII_LOG_PATTERNS) {
          if (pattern.test(logContext)) {
            if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
            const isTypeOrComment = /type\s|interface\s|\/\/|\/\*|\*\s/.test(trimmed);
            if (isTypeOrComment) continue;

            let hasException = false;
            for (let j = Math.max(0, i - 2); j <= i; j++) {
              if (lines[j] && lines[j].includes(EXCEPTION_MARKER)) {
                hasException = true;
                break;
              }
            }
            if (!hasException) {
              console.error(`PII_LOG_VIOLATION: ${rel}:${i + 1} — potential PII "${field}" in log/error output`);
              violations++;
            }
          }
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-observability-logging: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_OBSERVABILITY_LOGGING_PASS");
