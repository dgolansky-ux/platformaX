import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const RULES_PATH = join(ROOT, "docs/governance/RULES_REGISTRY.yml");

const VALID_SEVERITIES = ["P0", "P1", "P2"];
const REQUIRED_FIELDS = ["id", "title", "severity", "category", "status"];

function parseRulesYml(content: string) {
  const rules: Record<string, string>[] = [];
  let current: Record<string, string> | null = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- id:")) {
      if (current) rules.push(current);
      current = { id: trimmed.replace("- id:", "").trim() };
    } else if (current && /^\w[\w_]*:/.test(trimmed)) {
      const colonIdx = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIdx).trim();
      const val = trimmed.slice(colonIdx + 1).trim();
      current[key] = val;
    }
  }
  if (current) rules.push(current);
  return rules;
}

describe("governance-registry guard logic", () => {
  it("PASS: RULES_REGISTRY.yml exists and is readable", () => {
    expect(existsSync(RULES_PATH)).toBe(true);
    const content = readFileSync(RULES_PATH, "utf-8");
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain("rules:");
  });

  it("PASS: every rule has required fields (id, title, severity, category, status)", () => {
    const content = readFileSync(RULES_PATH, "utf-8");
    const rules = parseRulesYml(content);
    expect(rules.length).toBeGreaterThan(0);

    for (const rule of rules) {
      for (const field of REQUIRED_FIELDS) {
        expect(rule[field], `Rule ${rule.id ?? "UNKNOWN"} missing field: ${field}`).toBeDefined();
        expect(rule[field].length).toBeGreaterThan(0);
      }
    }
  });

  it("FAIL: detects invalid severity (not P0/P1/P2)", () => {
    const fakeRule = { id: "FAKE-001", title: "test", severity: "P9", category: "test", status: "active" };
    expect(VALID_SEVERITIES.includes(fakeRule.severity)).toBe(false);
  });

  it("PASS: all real rules have valid severity", () => {
    const content = readFileSync(RULES_PATH, "utf-8");
    const rules = parseRulesYml(content);

    for (const rule of rules) {
      expect(
        VALID_SEVERITIES.includes(rule.severity),
        `Rule ${rule.id} has invalid severity: ${rule.severity}`,
      ).toBe(true);
    }
  });
});
