import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
const SCAN_DIRS = ["client/src", "server/domains-v2", "shared"];
const EXCEPTION_MARKER = "PII_SECURITY_EXCEPTION:";

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "coverage"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function hasException(lines, lineIdx) {
  for (let i = Math.max(0, lineIdx - 2); i <= lineIdx; i++) {
    if (lines[i] && lines[i].includes(EXCEPTION_MARKER)) return true;
  }
  return false;
}

const PII_IN_LOGS = [
  { pattern: /console\.(log|warn|error|info|debug)\s*\([^)]*email/i, label: "email in console log" },
  { pattern: /console\.(log|warn|error|info|debug)\s*\([^)]*phone/i, label: "phone in console log" },
  { pattern: /console\.(log|warn|error|info|debug)\s*\([^)]*dateOfBirth/i, label: "dateOfBirth in console log" },
  { pattern: /console\.(log|warn|error|info|debug)\s*\([^)]*token/i, label: "token in console log" },
  { pattern: /console\.(log|warn|error|info|debug)\s*\([^)]*session/i, label: "session in console log" },
  { pattern: /console\.(log|warn|error|info|debug)\s*\([^)]*password/i, label: "password in console log" },
];

const CLIENT_FORBIDDEN = [
  { pattern: /SERVICE_ROLE_KEY/, label: "SERVICE_ROLE_KEY in client code" },
  { pattern: /DATABASE_URL/, label: "DATABASE_URL in client code" },
  { pattern: /supabaseServiceRole|service_role/, label: "Supabase service role in client code" },
];

const STORAGE_AS_PERSISTENCE = [
  { pattern: /localStorage\s*\.\s*(setItem|getItem)\s*\(\s*["'](auth|profile|user|token|session)/, label: "localStorage as auth/profile persistence" },
  { pattern: /sessionStorage\s*\.\s*(setItem|getItem)\s*\(\s*["'](auth|profile|user|token|backend)/, label: "sessionStorage as auth/backend persistence" },
];

const BASE64_UPLOAD = [
  { pattern: /readAsDataURL/, label: "readAsDataURL (base64 upload)" },
  { pattern: /data:image\/[^;]+;base64,/, label: "base64 data URL literal" },
  { pattern: /toDataURL\s*\(/, label: "canvas toDataURL" },
];

let violations = 0;

for (const scanDir of SCAN_DIRS) {
  const absDir = join(ROOT, scanDir);
  if (!existsSync(absDir)) continue;
  const files = walk(absDir);
  for (const fp of files) {
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(fp)) continue;
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    if (/\.(test|spec|fixture)\./.test(rel)) continue;
    if (rel.includes("__tests__/")) continue;
    if (rel.includes("scripts/check-")) continue;

    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      if (hasException(lines, i)) continue;

      for (const { pattern, label } of PII_IN_LOGS) {
        if (pattern.test(lines[i])) {
          console.error(`PII_SECURITY_VIOLATION [logging-pii]: ${rel}:${i + 1} — ${label}`);
          violations++;
        }
      }

      if (rel.startsWith("client/")) {
        for (const { pattern, label } of CLIENT_FORBIDDEN) {
          if (pattern.test(lines[i])) {
            const trimmed = lines[i].trim();
            if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
            console.error(`PII_SECURITY_VIOLATION [client-secret]: ${rel}:${i + 1} — ${label}`);
            violations++;
          }
        }

        for (const { pattern, label } of STORAGE_AS_PERSISTENCE) {
          if (pattern.test(lines[i])) {
            console.error(`PII_SECURITY_VIOLATION [storage-persistence]: ${rel}:${i + 1} — ${label}`);
            violations++;
          }
        }
      }

      for (const { pattern, label } of BASE64_UPLOAD) {
        if (pattern.test(lines[i])) {
          const trimmed = lines[i].trim();
          if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
          if (content.includes("MOCK_LOCAL_ONLY") || content.includes("TEST_FIXTURE")) continue;
          console.error(`PII_SECURITY_VIOLATION [base64-upload]: ${rel}:${i + 1} — ${label}`);
          violations++;
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-logging-pii-security: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_LOGGING_PII_SECURITY_PASS");
