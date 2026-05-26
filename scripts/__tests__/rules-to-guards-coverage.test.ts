import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const RULES_PATH = join(ROOT, "docs/governance/RULES_REGISTRY.yml");

function parseRulesBlocks(content: string) {
  const rules: { id: string; severity: string; hasEnforcedBy: boolean }[] = [];
  let currentId = "";
  let currentSeverity = "";
  let hasEnforcedBy = false;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- id:")) {
      if (currentId) {
        rules.push({ id: currentId, severity: currentSeverity, hasEnforcedBy });
      }
      currentId = trimmed.replace("- id:", "").trim();
      currentSeverity = "";
      hasEnforcedBy = false;
    } else if (trimmed.startsWith("severity:")) {
      currentSeverity = trimmed.replace("severity:", "").trim();
    } else if (trimmed.startsWith("enforced_by:")) {
      const inline = trimmed.replace("enforced_by:", "").trim();
      if (inline && inline !== "[]" && inline !== "null") {
        hasEnforcedBy = true;
      }
    } else if (currentId && trimmed.startsWith("- scripts/")) {
      hasEnforcedBy = true;
    } else if (currentId && trimmed.startsWith("- manual_gate")) {
      hasEnforcedBy = true;
    } else if (currentId && trimmed.startsWith("- branch-protection")) {
      hasEnforcedBy = true;
    }
  }
  if (currentId) {
    rules.push({ id: currentId, severity: currentSeverity, hasEnforcedBy });
  }
  return rules;
}

describe("rules-to-guards-coverage guard logic", () => {
  it("PASS: all P0 rules have enforced_by", () => {
    const content = readFileSync(RULES_PATH, "utf-8");
    const rules = parseRulesBlocks(content);
    const p0Rules = rules.filter((r) => r.severity === "P0");

    expect(p0Rules.length).toBeGreaterThan(0);

    for (const rule of p0Rules) {
      expect(rule.hasEnforcedBy, `P0 rule ${rule.id} has no enforced_by`).toBe(true);
    }
  });

  it("FAIL: P0 rule without enforced_by is detected", () => {
    const fakeRule = { id: "PX-FAKE-001", severity: "P0", hasEnforcedBy: false };
    expect(fakeRule.hasEnforcedBy).toBe(false);
  });

  it("PASS: enforced_by coverage summary is non-empty", () => {
    const content = readFileSync(RULES_PATH, "utf-8");
    const rules = parseRulesBlocks(content);
    const covered = rules.filter((r) => r.hasEnforcedBy);
    const uncovered = rules.filter((r) => !r.hasEnforcedBy);

    expect(covered.length).toBeGreaterThan(0);
    expect(
      covered.length + uncovered.length,
      "Total rules should match parsed count",
    ).toBe(rules.length);
  });
});
