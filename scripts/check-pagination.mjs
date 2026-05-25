import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();

const SCAN_DIRS = [
  "server/domains-v2",
  "client/src/features-v2",
  "client/src/app-v2",
];

const LIST_INDICATORS = [
  "findAll", "findMany", "getList", "fetchList", "listAll",
  "searchAll", "getFeed", "fetchFeed", "queryAll",
];

const PAGINATION_MARKERS = [
  "limit", "maxLimit", "cursor", "fixedCap", "stableOrder",
  "offset", "pageSize", "perPage", "take",
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

let runtimeListsFound = false;
let violations = 0;

for (const scanDir of SCAN_DIRS) {
  const absDir = join(ROOT, scanDir);
  const files = walk(absDir);
  for (const fp of files) {
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(fp)) continue;
    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }
    const rel = relative(ROOT, fp).replace(/\\/g, "/");

    for (const indicator of LIST_INDICATORS) {
      if (content.includes(indicator)) {
        runtimeListsFound = true;
        const hasPagination = PAGINATION_MARKERS.some(m => content.includes(m));
        if (!hasPagination) {
          console.error(`PAGINATION_VIOLATION: "${indicator}" without pagination in ${rel}`);
          violations++;
        }
      }
    }
  }
}

if (!runtimeListsFound) {
  console.log("PAGINATION_CHECK_NO_RUNTIME_LISTS");
  process.exit(0);
}

if (violations > 0) {
  console.error(`\ncheck-pagination: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_PAGINATION_PASS");
