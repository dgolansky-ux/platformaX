import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();

const SCAN_PATTERNS = [
  "server/domains-v2",
  "shared",
];

const PII_FIELDS = [
  "email", "phone", "dateOfBirth", "birthDate",
  "privateContact", "authMetadata", "provider",
  "token", "serviceRole",
];

const ALLOWLIST_MARKER = "ALLOW_PRIVATE_DTO_PII";

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function isPublicFile(rel) {
  return rel.includes("dto.ts") || rel.includes("public-api.ts") || rel.endsWith(".ts");
}

function isPrivateContext(rel) {
  return rel.includes("/internal/") || rel.includes("/admin/") || rel.includes("/private/");
}

let violations = 0;

for (const scanDir of SCAN_PATTERNS) {
  const absDir = join(ROOT, scanDir);
  const files = walk(absDir);
  for (const fp of files) {
    if (!/\.ts$/.test(fp)) continue;
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    if (isPrivateContext(rel)) continue;
    if (!(rel.includes("dto") || rel.includes("public-api") || rel.startsWith("shared/"))) continue;

    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }
    if (content.includes(ALLOWLIST_MARKER)) continue;

    for (const field of PII_FIELDS) {
      const regex = new RegExp(`\\b${field}\\b`, "g");
      if (regex.test(content)) {
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (new RegExp(`\\b${field}\\b`).test(lines[i])) {
            const trimmed = lines[i].trim();
            if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
            console.error(`PUBLIC_DTO_PII: "${field}" in ${rel}:${i + 1}`);
            violations++;
          }
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-public-dto-pii: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_PUBLIC_DTO_PII_PASS");
