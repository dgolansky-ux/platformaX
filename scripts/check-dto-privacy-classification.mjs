import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
const SCAN_DIR = "server/domains-v2";

const PII_FIELDS = [
  "email", "phone", "dateOfBirth", "privateContact",
  "authMetadata", "authProvider", "token", "session",
  "service_role", "DATABASE_URL",
];

const PRIVACY_CLASSIFICATION_MARKERS = [
  "PRIVACY:", "Privacy:", "privacy:",
  "PUBLIC_DTO", "PRIVATE_DTO", "ADMIN_DTO",
  "PublicProfileDTO", "PrivateProfileDTO", "AdminProfileDTO",
  "Public DTO", "Private DTO", "Admin DTO",
  "@privacy", "privacy classification",
];

const EXCEPTION_MARKER = "ALLOW_PRIVATE_DTO_PII";

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

function isInternalFile(rel) {
  return rel.includes("/internal/") || rel.includes("/admin/") || rel.includes("/private/");
}

let violations = 0;

const absDir = join(ROOT, SCAN_DIR);
if (!existsSync(absDir)) {
  console.log("CHECK_DTO_PRIVACY_CLASSIFICATION_PASS (no domains directory)");
  process.exit(0);
}

const files = walk(absDir);

for (const fp of files) {
  if (!/\.ts$/.test(fp)) continue;
  const rel = relative(ROOT, fp).replace(/\\/g, "/");

  if (!rel.includes("dto")) continue;
  if (isInternalFile(rel)) continue;
  if (rel.includes("__tests__/")) continue;

  let content;
  try { content = readFileSync(fp, "utf-8"); } catch { continue; }
  if (content.includes(EXCEPTION_MARKER)) continue;

  if (content.includes("SCAFFOLD_ONLY")) continue;
  const hasRealExports = /export\s+(type|interface|class|const|function|enum)\s+\w/.test(content);
  if (!hasRealExports) continue;

  const hasClassification = PRIVACY_CLASSIFICATION_MARKERS.some(m => content.includes(m));

  if (!hasClassification) {
    console.error(`DTO_PRIVACY_VIOLATION: ${rel} — DTO file without privacy classification comment or Public/Private/Admin type`);
    violations++;
  }

  const isPublicContext = !isInternalFile(rel) && !rel.includes("/private/");
  if (isPublicContext) {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

      if (/Public.*DTO|export\s+(type|interface).*Public/.test(line)) {
        const blockEnd = Math.min(lines.length, i + 30);
        for (let j = i; j < blockEnd; j++) {
          const blockLine = lines[j].trim();
          if (blockLine.startsWith("//") || blockLine.startsWith("*")) continue;
          for (const field of PII_FIELDS) {
            const fieldRegex = new RegExp(`\\b${field}\\b`);
            if (fieldRegex.test(blockLine) && !blockLine.includes("never") && !blockLine.includes("undefined")) {
              console.error(`DTO_PRIVACY_VIOLATION: ${rel}:${j + 1} — PII field "${field}" in Public DTO`);
              violations++;
            }
          }
          if (blockLine === "}" || blockLine === "};") break;
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-dto-privacy-classification: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_DTO_PRIVACY_CLASSIFICATION_PASS");
