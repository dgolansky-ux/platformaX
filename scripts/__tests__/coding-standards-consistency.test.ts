import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { evaluateCodingStandardsConsistency } from "../check-coding-standards-consistency.mjs";

const ROOT = process.cwd();

function currentInputs() {
  return {
    rulesContent: readFileSync(
      join(ROOT, "docs/governance/RULES_REGISTRY.yml"),
      "utf-8",
    ),
    matrixContent: readFileSync(
      join(ROOT, "docs/governance/RULES_TO_GUARDS_MATRIX.md"),
      "utf-8",
    ),
    indexContent: readFileSync(
      join(ROOT, "docs/governance/GOVERNANCE_INDEX.md"),
      "utf-8",
    ),
    codingContent: readFileSync(
      join(ROOT, "docs/architecture/PlatformaX-V2-coding-standards.md"),
      "utf-8",
    ),
    exceptionsContent: readFileSync(
      join(ROOT, "docs/governance/EXCEPTIONS_REGISTER.md"),
      "utf-8",
    ),
  };
}

describe("check-coding-standards-consistency", () => {
  it("PASS: current governance docs are internally consistent", () => {
    expect(evaluateCodingStandardsConsistency(currentInputs()).violations).toEqual(
      [],
    );
  });

  it("FAIL: PX-CODE rule missing from matrix is detected", () => {
    const inputs = currentInputs();
    inputs.matrixContent = inputs.matrixContent.replace(
      /\| PX-CODE-005 \|[^\n]+\n/,
      "",
    );

    expect(
      evaluateCodingStandardsConsistency(inputs).violations.join("\n"),
    ).toContain("PX-CODE-005 missing from RULES_TO_GUARDS_MATRIX.md");
  });

  it("FAIL: canonical exception block must include expiry and rule fields", () => {
    const inputs = currentInputs();
    inputs.codingContent = inputs.codingContent
      .replace("Rule:", "Rule removed:")
      .replace("Expiry:", "Expiry removed:");

    const violations = evaluateCodingStandardsConsistency(inputs).violations.join(
      "\n",
    );
    expect(violations).toContain(
      "coding standards must define canonical PLATFORMAX_EXCEPTION fields",
    );
  });

  it("FAIL: alias families require canonical/deprecated_alias relation", () => {
    const inputs = currentInputs();
    inputs.rulesContent = inputs.rulesContent.replace(
      /- id: PX-IDEMP-001([\s\S]*?)status: deprecated_alias/,
      "- id: PX-IDEMP-001$1status: active",
    );

    expect(
      evaluateCodingStandardsConsistency(inputs).violations.join("\n"),
    ).toContain("PX-IDEMPOTENCY-001 must be canonical");
  });
});
