import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();

const SCAN_DIRS = [
  "client/src/app-v2",
  "client/src/features-v2",
  "server/domains-v2",
  "shared",
];

const BLOCKED_TERMS = [
  "readAsDataURL",
  "dataUrl",
  "base64Upload",
];

const BLOCKED_REGEX = /\bbase64\b/i;

const GOVERNANCE_PREFIXES = ["docs/", "scripts/"];

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

let violations = 0;

for (const scanDir of SCAN_DIRS) {
  const absDir = join(ROOT, scanDir);
  const files = walk(absDir);
  for (const fp of files) {
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(fp)) continue;
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    if (GOVERNANCE_PREFIXES.some(p => rel.startsWith(p))) continue;

    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }

    for (const term of BLOCKED_TERMS) {
      if (content.includes(term)) {
        console.error(`MEDIA_BASE64_VIOLATION: "${term}" in ${rel}`);
        violations++;
      }
    }

    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (BLOCKED_REGEX.test(lines[i])) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
        console.error(`MEDIA_BASE64_VIOLATION: "base64" in ${rel}:${i + 1}`);
        violations++;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-media-base64: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_MEDIA_BASE64_PASS");
