import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

function fileExists(rel: string): boolean {
  return existsSync(join(ROOT, rel));
}

describe("bramka-acceptance: critical file existence", () => {
  it("BRAMKA document exists", () => {
    expect(fileExists("docs/architecture/BRAMKA.md")).toBe(true);
  });

  it("rules-check umbrella exists", () => {
    expect(fileExists("scripts/rules-check.mjs")).toBe(true);
  });

  it("check-diff-safety exists", () => {
    expect(fileExists("scripts/check-diff-safety.mjs")).toBe(true);
  });

  it("husky pre-commit exists", () => {
    expect(fileExists(".husky/pre-commit")).toBe(true);
  });

  it("husky pre-push exists", () => {
    expect(fileExists(".husky/pre-push")).toBe(true);
  });

  it("CODEOWNERS exists", () => {
    expect(fileExists(".github/CODEOWNERS")).toBe(true);
  });

  it("PR template exists", () => {
    expect(fileExists(".github/pull_request_template.md")).toBe(true);
  });

  it("CI workflow exists", () => {
    expect(fileExists(".github/workflows/v2-gates.yml")).toBe(true);
  });

  it("ADR template exists", () => {
    expect(fileExists("docs/architecture/adr/ADR-000-template.md")).toBe(true);
  });

  it("Domain Ownership Matrix exists", () => {
    expect(fileExists("docs/architecture/DOMAIN_OWNERSHIP_MATRIX.md")).toBe(true);
  });

  it("REVIEW_REPORTS_INDEX exists", () => {
    expect(fileExists("docs/review/REVIEW_REPORTS_INDEX.md")).toBe(true);
  });

  it("secret scanner exists", () => {
    expect(fileExists("scripts/check-secret-scan.mjs")).toBe(true);
  });

  it("commitlint config exists", () => {
    expect(fileExists("commitlint.config.mjs")).toBe(true);
  });

  it("no-commit-if-dirty-gates exists", () => {
    expect(fileExists("scripts/no-commit-if-dirty-gates.mjs")).toBe(true);
  });
});

describe("bramka-acceptance: guard scripts exist", () => {
  const guards = [
    "check-fake-done.mjs",
    "check-domain-status.mjs",
    "audit-domain-boundaries.mjs",
    "check-test-env-safety.mjs",
    "check-file-complexity.mjs",
    "check-env-safety.mjs",
    "check-removed-product-areas.mjs",
    "check-supabase-migrations-safety.mjs",
    "check-build-artifacts.mjs",
    "validate-bundle.mjs",
    "check-review-reports-index.mjs",
    "check-pre-commit-decision.mjs",
    "check-self-audit-evidence.mjs",
    "check-bramka-acceptance.mjs",
  ];

  for (const guard of guards) {
    it(`${guard} exists`, () => {
      expect(fileExists(`scripts/${guard}`)).toBe(true);
    });
  }
});
