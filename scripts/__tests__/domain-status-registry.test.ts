import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const REGISTRY_PATH = join(ROOT, "docs/governance/DOMAIN_STATUS_REGISTRY.yml");

const ALLOWED_STATUSES = [
  "NOT_STARTED",
  "SCAFFOLD_ONLY",
  "UI_SHELL_ONLY",
  "MOCK_LOCAL_ONLY",
  "PARTIAL",
  "IMPLEMENTED",
  "BLOCKED",
  "MANUAL_REVIEW_REQUIRED",
  "PLANNED",
];

function parseDomains(content: string) {
  const domains: Record<string, string>[] = [];
  let current: Record<string, string> | null = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- name:")) {
      if (current) domains.push(current);
      current = { name: trimmed.replace("- name:", "").trim() };
    } else if (current && /^\w[\w_]*:/.test(trimmed)) {
      const colonIdx = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIdx).trim();
      const val = trimmed.slice(colonIdx + 1).trim();
      current[key] = val;
    }
  }
  if (current) domains.push(current);
  return domains;
}

function findConflictsWithoutResolution(content: string) {
  const problems: string[] = [];
  let currentName = "";
  let hasConflictTrue = false;
  let hasManualResolution = false;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- name:")) {
      if (currentName && hasConflictTrue && !hasManualResolution) {
        problems.push(currentName);
      }
      currentName = trimmed.replace("- name:", "").trim();
      hasConflictTrue = false;
      hasManualResolution = false;
    } else if (trimmed === "conflict: true") {
      hasConflictTrue = true;
    } else if (trimmed.startsWith("requires_manual_resolution:")) {
      const val = trimmed.replace("requires_manual_resolution:", "").trim();
      if (val && val !== "null" && val !== "false") {
        hasManualResolution = true;
      }
    }
  }
  if (currentName && hasConflictTrue && !hasManualResolution) {
    problems.push(currentName);
  }
  return problems;
}

describe("domain-status-registry guard logic", () => {
  it("PASS: DOMAIN_STATUS_REGISTRY.yml exists and has entries", () => {
    expect(existsSync(REGISTRY_PATH)).toBe(true);
    const content = readFileSync(REGISTRY_PATH, "utf-8");
    expect(content).toContain("domains:");
    const domains = parseDomains(content);
    expect(domains.length).toBeGreaterThan(0);
  });

  it("PASS: status values are from allowed taxonomy", () => {
    const content = readFileSync(REGISTRY_PATH, "utf-8");
    const domains = parseDomains(content);

    for (const domain of domains) {
      expect(
        ALLOWED_STATUSES.includes(domain.status),
        `Domain "${domain.name}" has invalid status: ${domain.status}`,
      ).toBe(true);
    }
  });

  it("PASS: all conflict:true entries have requires_manual_resolution", () => {
    const content = readFileSync(REGISTRY_PATH, "utf-8");
    const problems = findConflictsWithoutResolution(content);
    expect(
      problems,
      `Domains with conflict:true but no requires_manual_resolution: ${problems.join(", ")}`,
    ).toEqual([]);
  });

  it("FAIL: conflict:true without requires_manual_resolution is detected", () => {
    const fakeContent = [
      "domains:",
      "  - name: fake-domain",
      "    status: PARTIAL",
      "    conflict: true",
    ].join("\n");

    const problems = findConflictsWithoutResolution(fakeContent);
    expect(problems).toContain("fake-domain");
  });
});
