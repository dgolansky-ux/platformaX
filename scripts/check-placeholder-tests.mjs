/**
 * check-placeholder-tests — fail on tautological placeholder assertions in tests.
 *
 * Scaffolded test files used to ship `expect(true).toBe(true)` (and similar
 * self-true assertions) that pass without testing anything. They give a false
 * sense of coverage. Real tests must assert real behavior, so this guard fails
 * the build if any test file still contains a placeholder tautology.
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
const SCAN_DIRS = ["server", "client", "scripts"];

// Tautologies that assert nothing about the system under test.
const PLACEHOLDER_PATTERNS = [
  /expect\(\s*true\s*\)\.toBe\(\s*true\s*\)/,
  /expect\(\s*false\s*\)\.toBe\(\s*false\s*\)/,
  /expect\(\s*true\s*\)\.toBeTruthy\(\s*\)/,
  /expect\(\s*1\s*\)\.toBe\(\s*1\s*\)/,
];

function isTestFile(name) {
  return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(name);
}

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "coverage"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else if (isTestFile(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

let violations = 0;

for (const scanDir of SCAN_DIRS) {
  for (const fp of walk(join(ROOT, scanDir))) {
    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (PLACEHOLDER_PATTERNS.some((p) => p.test(lines[i]))) {
        console.error(
          `PLACEHOLDER_TEST: ${rel}:${i + 1} — tautological placeholder assertion (${lines[i].trim()})`,
        );
        violations++;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-placeholder-tests: ${violations} placeholder assertion(s) found`);
  process.exit(1);
}

console.log("CHECK_PLACEHOLDER_TESTS_PASS");
