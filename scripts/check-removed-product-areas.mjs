import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();

const SCAN_DIRS = [
  "client/src/app-v2",
  "client/src/features-v2",
  "server",
  "shared",
];

const SCAN_FILES = ["client/src/App.tsx"];

const BLOCKED_TERMS = [
  "seller", "purchases", "marketplace", "calendar", "notes",
  "habits", "tasks", "pages", "pasje", "passions", "fundraiser",
  "donations", "commerce", "productivity", "stripe", "checkout",
  "payments", "knowledgeBase", "recruitment", "portfolio",
];

const GOVERNANCE_PREFIXES = [
  "docs/", "scripts/check-", "scripts/rules-",
  "scripts/arch-", "scripts/audit-", "scripts/no-commit-",
  "scripts/validate-",
];

const IGNORED_EXTENSIONS = [".md", ".txt"];

function isGovernance(rel) {
  return GOVERNANCE_PREFIXES.some(p => rel.startsWith(p));
}

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "coverage", "domains-v2"].includes(entry.name) && dir === join(ROOT, "server")) {
        if (entry.name === "domains-v2") {
          results.push(...walk(full));
        }
        continue;
      }
      if (["node_modules", ".git", "dist", "coverage"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

let violations = 0;
const files = [];
for (const d of SCAN_DIRS) {
  files.push(...walk(join(ROOT, d)));
}
for (const f of SCAN_FILES) {
  const fp = join(ROOT, f);
  if (existsSync(fp)) files.push(fp);
}

for (const fp of files) {
  const rel = relative(ROOT, fp).replace(/\\/g, "/");
  if (isGovernance(rel)) continue;
  const ext = rel.substring(rel.lastIndexOf("."));
  if (IGNORED_EXTENSIONS.includes(ext)) continue;

  let content;
  try { content = readFileSync(fp, "utf-8"); } catch { continue; }

  for (const term of BLOCKED_TERMS) {
    const regex = new RegExp(`\\b${term}\\b`, "i");
    if (regex.test(content)) {
      const isImportOrRoute = /import|from|Route|path:|href:|Link|require|chunk/i.test(content);
      if (isImportOrRoute || /\.(ts|tsx|js|jsx|mjs)$/.test(rel)) {
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            const line = lines[i].trim();
            if (line.startsWith("//") || line.startsWith("*") || line.startsWith("/*")) continue;
            if (line.includes("BLOCKED_TERMS") || line.includes("blocked") || line.includes("BLOCKED")) continue;
            console.error(`REMOVED_PRODUCT_AREA: "${term}" active in ${rel}:${i + 1}`);
            violations++;
          }
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-removed-product-areas: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_REMOVED_PRODUCT_AREAS_PASS");
