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

const MARKDOWN_STATUS_DOCS = [
  "docs/architecture/DOMAIN_REGISTRY.md",
  "docs/architecture/DOMAIN_OWNERSHIP_MATRIX.md",
  "docs/architecture/PlatformaX-V2-domain-status.md",
];

function cleanCell(cell: string): string {
  return cell.trim().replace(/^`+|`+$/g, "").trim();
}

function parseMarkdownStatusRows(content: string): { name: string; statusCells: string[] }[] {
  const rows: { name: string; statusCells: string[] }[] = [];
  for (const line of content.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map(cleanCell);
    if (cells.length < 2) continue;
    if (cells.every((c) => /^:?-+:?$/.test(c) || c === "")) continue;
    rows.push({ name: cells[0], statusCells: cells.filter((c) => ALLOWED_STATUSES.includes(c)) });
  }
  return rows;
}

function expectedStatusByName(): Record<string, string> {
  const content = readFileSync(REGISTRY_PATH, "utf-8");
  const map: Record<string, string> = {};
  for (const d of parseDomains(content)) {
    if (d.status) map[d.name] = d.status;
  }
  return map;
}

function findDrift(docContent: string, expected: Record<string, string>): string[] {
  const problems: string[] = [];
  for (const row of parseMarkdownStatusRows(docContent)) {
    const exp = expected[row.name];
    if (!exp) continue;
    const distinct = [...new Set(row.statusCells)];
    if (distinct.length !== 1) continue;
    if (distinct[0] !== exp) problems.push(`${row.name}:${distinct[0]}!=${exp}`);
  }
  return problems;
}

describe("domain-status-registry markdown anti-drift", () => {
  it("PASS: status docs agree with DOMAIN_STATUS_REGISTRY.yml", () => {
    const expected = expectedStatusByName();
    for (const docRel of MARKDOWN_STATUS_DOCS) {
      const docPath = join(ROOT, docRel);
      expect(existsSync(docPath), `${docRel} exists`).toBe(true);
      const problems = findDrift(readFileSync(docPath, "utf-8"), expected);
      expect(problems, `${docRel} drift: ${problems.join(", ")}`).toEqual([]);
    }
  });

  it("FAIL: drift between a status doc and the registry is detected", () => {
    const expected = { identity: "PARTIAL" };
    const driftedDoc = [
      "| Domain | Type | Status |",
      "|---|---|---|",
      "| identity | OWNER_DOMAIN | SCAFFOLD_ONLY |",
    ].join("\n");
    expect(findDrift(driftedDoc, expected)).toContain("identity:SCAFFOLD_ONLY!=PARTIAL");
  });

  it("PASS: illustrative two-status rows are not treated as declarations", () => {
    const expected = { identity: "PARTIAL" };
    const exampleDoc = "| identity | PLANNED | SCAFFOLD_ONLY | notes |";
    expect(findDrift(exampleDoc, expected)).toEqual([]);
  });
});

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
