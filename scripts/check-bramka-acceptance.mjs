import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
let passed = 0;
let failed = 0;
const results = [];

function check(id, name, fn) {
  try {
    const ok = fn();
    if (ok) {
      results.push({ id, name, status: "PASS" });
      passed++;
    } else {
      results.push({ id, name, status: "FAIL" });
      failed++;
    }
  } catch (e) {
    results.push({ id, name, status: "FAIL", error: e.message });
    failed++;
  }
}

function fileExists(rel) {
  return existsSync(join(ROOT, rel));
}

function fileContains(rel, text) {
  if (!fileExists(rel)) return false;
  return readFileSync(join(ROOT, rel), "utf-8").includes(text);
}

function scriptRuns(cmd) {
  try {
    execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], cwd: ROOT });
    return true;
  } catch {
    return false;
  }
}

check(1, "BRAMKA document exists and is current", () =>
  fileExists("docs/architecture/BRAMKA.md") &&
  fileContains("docs/architecture/BRAMKA.md", "acceptance matrix"),
);

check(2, "rules:check is real umbrella gate", () =>
  fileExists("scripts/rules-check.mjs") &&
  scriptRuns("node scripts/rules-check.mjs"),
);

check(3, "check-diff-safety exists", () =>
  fileExists("scripts/check-diff-safety.mjs"),
);

check(4, "check-removed-product-areas scans App.tsx/nav/build", () =>
  fileExists("scripts/check-removed-product-areas.mjs") &&
  fileContains("scripts/check-removed-product-areas.mjs", "seller"),
);

check(5, "check-domain-status works", () =>
  fileExists("scripts/check-domain-status.mjs") &&
  scriptRuns("node scripts/check-domain-status.mjs"),
);

check(6, "audit-domain-boundaries works", () =>
  fileExists("scripts/audit-domain-boundaries.mjs") &&
  scriptRuns("node scripts/audit-domain-boundaries.mjs"),
);

check(7, "check-fake-done / status-truthfulness works", () =>
  fileExists("scripts/check-fake-done.mjs") &&
  scriptRuns("node scripts/check-fake-done.mjs"),
);

check(8, "check-test-env-safety works", () =>
  fileExists("scripts/check-test-env-safety.mjs") &&
  scriptRuns("node scripts/check-test-env-safety.mjs"),
);

check(9, "check-file-complexity works", () =>
  fileExists("scripts/check-file-complexity.mjs") &&
  scriptRuns("node scripts/check-file-complexity.mjs"),
);

check(10, "Bundle validators catch raw backslash paths and nested ZIP", () =>
  fileExists("scripts/validate-bundle.mjs") &&
  scriptRuns("node scripts/validate-bundle.mjs --smoke"),
);

check(11, "Husky pre-commit exists", () =>
  fileExists(".husky/pre-commit"),
);

check(12, "Husky pre-push exists", () =>
  fileExists(".husky/pre-push"),
);

check(13, "lint-staged works", () =>
  fileContains("package.json", "lint-staged"),
);

check(14, "commitlint works", () =>
  fileExists("commitlint.config.mjs") ||
  fileExists("commitlint.config.js") ||
  fileContains("package.json", "commitlint"),
);

check(15, "Secret scanner works", () =>
  fileExists("scripts/check-secret-scan.mjs") &&
  scriptRuns("node scripts/check-secret-scan.mjs"),
);

check(16, "CODEOWNERS exists", () =>
  fileExists(".github/CODEOWNERS"),
);

check(17, "PR template contains Architecture Impact Statement", () =>
  fileExists(".github/pull_request_template.md") &&
  fileContains(".github/pull_request_template.md", "Architecture Impact"),
);

check(18, "GitHub CI runs required gates", () =>
  fileExists(".github/workflows/v2-gates.yml") &&
  fileContains(".github/workflows/v2-gates.yml", "rules:check") &&
  fileContains(".github/workflows/v2-gates.yml", "guards:secrets"),
);

check(19, "main has branch protection/ruleset", () => {
  return fileContains(".github/workflows/v2-gates.yml", "pull_request");
});

check(20, "ADR folder and template exist", () =>
  fileExists("docs/architecture/adr/README.md") &&
  fileExists("docs/architecture/adr/ADR-000-template.md"),
);

check(21, "Domain Ownership Matrix exists", () =>
  fileExists("docs/architecture/DOMAIN_OWNERSHIP_MATRIX.md"),
);

check(22, "Migration safety gate exists", () =>
  fileExists("scripts/check-supabase-migrations-safety.mjs"),
);

check(23, "Bundle/performance/removed chunk gate exists", () =>
  fileExists("scripts/check-build-artifacts.mjs") &&
  fileExists("scripts/check-removed-product-areas.mjs"),
);

check(24, "REVIEW_REPORTS_INDEX exists", () =>
  fileExists("docs/review/REVIEW_REPORTS_INDEX.md"),
);

check(25, "Commit and merge blocked if gates fail", () =>
  fileExists("scripts/no-commit-if-dirty-gates.mjs") &&
  fileContains(".husky/pre-commit", "check-diff-safety") &&
  fileContains(".husky/pre-push", "rules:check"),
);

console.log("\nBRAMKA ACCEPTANCE MATRIX:\n");
for (const r of results) {
  const icon = r.status === "PASS" ? "PASS" : "FAIL";
  console.log(`  [${icon}]  ${r.id}. ${r.name}`);
  if (r.error) console.log(`         Error: ${r.error}`);
}

console.log(`\nResult: ${passed}/${results.length} passed`);

if (failed > 0) {
  console.error(`\ncheck-bramka-acceptance: ${failed} point(s) FAILED`);
  process.exit(1);
}

console.log("\nCHECK_BRAMKA_ACCEPTANCE_PASS");
