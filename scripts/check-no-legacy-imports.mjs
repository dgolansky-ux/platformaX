import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();

const SCAN_DIRS = [
  "client/src/app-v2",
  "client/src/features-v2",
  "server/domains-v2",
  "shared",
];

const BLOCKED_IMPORTS = [
  "client/src/features/",
  "client/src/pages/",
  "client/src/components/",
  "server/domains/",
  "legacy/",
  "legacy-source/",
  "old-code/",
  "Starykod/",
];

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
    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    for (const blocked of BLOCKED_IMPORTS) {
      const patterns = [
        `from "${blocked}`,
        `from '${blocked}`,
        `import("${blocked}`,
        `import('${blocked}`,
        `require("${blocked}`,
        `require('${blocked}`,
        `from "@/${blocked}`,
        `from '@/${blocked}`,
      ];
      for (const pat of patterns) {
        if (content.includes(pat)) {
          console.error(`LEGACY_IMPORT_VIOLATION: "${blocked}" imported in ${rel}`);
          violations++;
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-no-legacy-imports: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_NO_LEGACY_IMPORTS_PASS");
