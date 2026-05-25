import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
const DIST_DIR = join(ROOT, "dist");

const REMOVED_CHUNKS = [
  "SellerPanel",
  "Marketplace",
  "Tasks",
  "Calendar",
  "Passions",
  "Fundraiser",
  "PageBuilder",
];

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

if (!existsSync(DIST_DIR)) {
  console.log("BUILD_ARTIFACT_CHECK_SKIPPED_NO_DIST");
  process.exit(0);
}

let violations = 0;
const files = walk(DIST_DIR);

for (const fp of files) {
  if (!/\.(js|html|css)$/.test(fp)) continue;
  let content;
  try { content = readFileSync(fp, "utf-8"); } catch { continue; }
  const rel = relative(ROOT, fp).replace(/\\/g, "/");

  for (const chunk of REMOVED_CHUNKS) {
    if (content.includes(chunk)) {
      console.error(`BUILD_ARTIFACT_VIOLATION: removed chunk "${chunk}" in ${rel}`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-build-artifacts: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_BUILD_ARTIFACTS_PASS");
