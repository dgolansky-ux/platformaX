import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();

const LIMITS = {
  component: { pattern: /\.(tsx)$/, limit: 350 },
  service: { pattern: /service\.(ts|js)$/, limit: 400 },
  repository: { pattern: /repository\.(ts|js)$/, limit: 500 },
  test: { pattern: /\.test\.(ts|tsx|js|jsx|mjs)$/, limit: 1000 },
  script: { pattern: /scripts\/.*(check|validate)\.(mjs|js|ts)$/, limit: 500 },
};

const EXCEPTION_MARKER = "ALLOW_FILE_SIZE_EXCEPTION";
const ESLINT_DISABLE_PATTERN = /eslint-disable.*max-lines/;

const SCAN_DIRS = ["client/src", "server", "shared", "scripts"];

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

let violations = 0;

for (const scanDir of SCAN_DIRS) {
  const absDir = join(ROOT, scanDir);
  const files = walk(absDir);
  for (const fp of files) {
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }

    if (content.includes(EXCEPTION_MARKER)) continue;

    if (ESLINT_DISABLE_PATTERN.test(content) && !content.includes(EXCEPTION_MARKER)) {
      console.error(`COMPLEXITY_VIOLATION: eslint-disable max-lines without ${EXCEPTION_MARKER} in ${rel}`);
      violations++;
    }

    const lineCount = content.split("\n").length;

    for (const [type, { pattern, limit }] of Object.entries(LIMITS)) {
      if (pattern.test(rel) && lineCount > limit) {
        console.error(`COMPLEXITY_VIOLATION: ${rel} has ${lineCount} lines (${type} limit: ${limit})`);
        violations++;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-file-complexity: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_FILE_COMPLEXITY_PASS");
