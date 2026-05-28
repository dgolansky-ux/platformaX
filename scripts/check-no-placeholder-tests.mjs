import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listSourceFiles } from "./lib/list-source-files.mjs";

const ROOT = process.cwd();

function fail(msg) {
  console.error(`PLACEHOLDER_TEST_VIOLATION: ${msg}`);
}

function isTestFile(p) {
  return (
    p.endsWith(".test.ts") ||
    p.endsWith(".test.tsx") ||
    p.endsWith(".spec.ts") ||
    p.endsWith(".spec.tsx")
  );
}

function hasAnyRealAssertion(src) {
  // Heuristic: if file has an expect(), it must not be only one of the trivial patterns.
  const expects = src.match(/\bexpect\s*\(/g) ?? [];
  if (expects.length === 0) return false;

  // Reject the most common placeholders.
  if (src.includes("expect(true).toBe(true)")) return false;

  // `expect(mod).toBeDefined()` as the only assertion in the file is too weak.
  const toBeDefined = src.match(/expect\s*\([^)]*\)\s*\.toBeDefined\s*\(\s*\)/g) ?? [];
  if (toBeDefined.length === expects.length) return false;

  return true;
}

function checkFile(relPath) {
  const abs = join(ROOT, relPath);
  const src = readFileSync(abs, "utf-8");

  let violations = 0;

  if (src.includes("expect(true).toBe(true)")) {
    fail(`${relPath}: contains expect(true).toBe(true)`);
    violations++;
  }

  if (/\bit\s*\(\s*["'`][^"'`]*placeholder[^"'`]*["'`]/i.test(src)) {
    fail(`${relPath}: test name contains 'placeholder'`);
    violations++;
  }

  if (!hasAnyRealAssertion(src)) {
    fail(`${relPath}: test file has no real assertions`);
    violations++;
  }

  return violations;
}

let violations = 0;

const files = listSourceFiles({
  roots: ["scripts", "server", "client", "shared"],
  extensions: [".ts", ".tsx"],
}).filter(isTestFile);

for (const rel of files) {
  violations += checkFile(rel);
}

if (violations > 0) {
  console.error(`\ncheck-no-placeholder-tests: ${violations} violation(s)`);
  process.exit(1);
}

console.log(`CHECK_NO_PLACEHOLDER_TESTS_PASS (${files.length} test files checked)`);

