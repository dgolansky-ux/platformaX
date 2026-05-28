import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateCoverage,
  parseMatrix,
  parseRegistryEntries,
} from "../check-rules-to-guards-coverage.mjs";

const ROOT = process.cwd();
const RULES_PATH = join(ROOT, "docs/governance/RULES_REGISTRY.yml");
const GUARDS_PATH = join(ROOT, "docs/governance/GUARDS_REGISTRY.yml");
const MATRIX_PATH = join(ROOT, "docs/governance/RULES_TO_GUARDS_MATRIX.md");

function currentCoverage() {
  return evaluateCoverage({
    rulesContent: readFileSync(RULES_PATH, "utf-8"),
    guardsContent: readFileSync(GUARDS_PATH, "utf-8"),
    matrixContent: readFileSync(MATRIX_PATH, "utf-8"),
    root: ROOT,
  });
}

describe("rules-to-guards-coverage parser", () => {
  it("parses registry entries and matrix rows", () => {
    const rules = parseRegistryEntries(readFileSync(RULES_PATH, "utf-8"));
    const guards = parseRegistryEntries(readFileSync(GUARDS_PATH, "utf-8"));
    const rows = parseMatrix(readFileSync(MATRIX_PATH, "utf-8"));

    expect(rules.some((r) => r.id === "PX-GOV-001")).toBe(true);
    expect(guards.some((g) => g.file === "scripts/check-fake-done.mjs")).toBe(
      true,
    );
    expect(rows.some((r) => r.ruleId === "PX-GOV-001")).toBe(true);
  });
});

describe("rules-to-guards-coverage guard logic", () => {
  it("PASS: current registry, guards and matrix are bidirectionally consistent", () => {
    const result = currentCoverage();
    expect(result.violations).toEqual([]);
  });

  it("FAIL: P0 active rule without guard or manual_gate is detected", () => {
    const result = evaluateCoverage({
      rulesContent: `
rules:
  - id: PX-FAKE-001
    title: Fake
    severity: P0
    status: active
`,
      guardsContent: "guards: []\n",
      matrixContent: "| PX-FAKE-001 | Fake | doc | — | YES | — |\n",
      root: ROOT,
    });

    expect(result.violations.join("\n")).toContain("has no guard or manual_gate");
  });

  it("FAIL: enforced_by script must exist in guard registry and list the rule", () => {
    const result = evaluateCoverage({
      rulesContent: `
rules:
  - id: PX-FAKE-001
    title: Fake
    severity: P1
    status: active
    enforced_by:
      - scripts/check-fake-done.mjs
`,
      guardsContent: `
guards:
  - id: GUARD-FAKE
    file: scripts/check-fake-done.mjs
    rules_enforced: [PX-OTHER-001]
`,
      matrixContent: "| PX-FAKE-001 | Fake | doc | check-fake-done | NO | — |\n",
      root: ROOT,
    });

    expect(result.violations.join("\n")).toContain(
      "does not list rule \"PX-FAKE-001\"",
    );
  });

  it("FAIL: matrix rule must exist in registry", () => {
    const result = evaluateCoverage({
      rulesContent: "rules: []\n",
      guardsContent: "guards: []\n",
      matrixContent: "| PX-MISSING-001 | Missing | doc | manual_gate | YES | — |\n",
      root: ROOT,
    });

    expect(result.violations.join("\n")).toContain(
      "matrix rule \"PX-MISSING-001\" does not exist",
    );
  });

  it("FAIL: registry rule must appear in matrix unless deprecated alias or local only", () => {
    const result = evaluateCoverage({
      rulesContent: `
rules:
  - id: PX-REG-001
    title: Registry only
    severity: P1
    status: active
    enforced_by:
      - manual_gate
`,
      guardsContent: "guards: []\n",
      matrixContent: "",
      root: ROOT,
    });

    expect(result.violations.join("\n")).toContain(
      "registry rule \"PX-REG-001\" missing from RULES_TO_GUARDS_MATRIX",
    );
  });

  it("FAIL: TODO_GUARD cannot remain when registry already has a guard", () => {
    const result = evaluateCoverage({
      rulesContent: `
rules:
  - id: PX-TODO-001
    title: Todo
    severity: P1
    status: active
    enforced_by:
      - scripts/check-fake-done.mjs
`,
      guardsContent: `
guards:
  - id: GUARD-TODO
    file: scripts/check-fake-done.mjs
    rules_enforced: [PX-TODO-001]
`,
      matrixContent:
        "| PX-TODO-001 | Todo | doc | TODO_GUARD | YES | TODO_GUARD: add guard |\n",
      root: ROOT,
    });

    expect(result.violations.join("\n")).toContain(
      "says TODO_GUARD but registry already has guard",
    );
  });

  it("FAIL: matrix summary cannot say 0 TODO_GUARD while TODO_GUARD remains", () => {
    const result = evaluateCoverage({
      rulesContent: `
rules:
  - id: PX-TODO-001
    title: Todo
    severity: P1
    status: active
    enforced_by:
      - manual_gate
`,
      guardsContent: "guards: []\n",
      matrixContent:
        "| PX-TODO-001 | Todo | doc | manual_gate | YES | TODO_GUARD: add guard |\n\n- **Documented governance gaps (TODO_GUARD):** 0 remaining\n",
      root: ROOT,
    });

    expect(result.violations.join("\n")).toContain(
      "summary says 0 TODO_GUARD remaining",
    );
  });
});
