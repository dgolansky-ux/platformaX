import { describe, it, expect } from "vitest";

const ALLOWED_STATUSES = new Set([
  "ACTIVE_EVIDENCE",
  "HISTORICAL_REPORT",
  "OUTDATED_BY_NEW_AUDIT",
  "SUPERSEDED",
  "BLOCKED",
  "MANUAL_REVIEW_REQUIRED",
]);

const BANNED_STATUSES = [
  "DONE", "FULL_DONE", "CLEAN", "FINAL_DONE",
  "COMPLETE", "BRAMKA_COMPLETE",
];

interface IndexEntry {
  name: string;
  status: string;
  supersededBy: string;
  evidencePath: string;
}

function parseTableLine(line: string): IndexEntry | null {
  const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
  if (cells.length < 6) return null;
  return {
    name: cells[0],
    status: cells[5],
    supersededBy: cells[6] || "",
    evidencePath: cells[7] || "",
  };
}

function validateEntry(entry: IndexEntry, folders: string[]): string[] {
  const errors: string[] = [];

  if (!ALLOWED_STATUSES.has(entry.status)) {
    errors.push(`Invalid status "${entry.status}"`);
  }

  for (const banned of BANNED_STATUSES) {
    if (entry.status === banned) {
      errors.push(`Banned status "${banned}"`);
    }
  }

  if (entry.status === "ACTIVE_EVIDENCE") {
    const hasEvidence = entry.evidencePath.includes("REPORT") || entry.evidencePath.includes("Evidence") || entry.evidencePath.includes("MANUAL_REVIEW_REQUIRED");
    if (!hasEvidence) {
      errors.push("ACTIVE_EVIDENCE without evidence path");
    }
  }

  if (entry.status === "SUPERSEDED") {
    if (!entry.supersededBy || entry.supersededBy === "—" || entry.supersededBy.trim() === "") {
      errors.push("SUPERSEDED without Superseded by");
    }
  }

  return errors;
}

function checkFolderCoverage(folders: string[], indexedNames: string[]): string[] {
  const errors: string[] = [];
  for (const folder of folders) {
    if (!indexedNames.includes(folder)) {
      errors.push(`Folder "${folder}" has no entry in index`);
    }
  }
  return errors;
}

describe("review-reports-index: folder coverage", () => {
  it("folder step-99 without index entry = FAIL", () => {
    const folders = ["step-01-governance", "step-99-missing"];
    const indexed = ["step-01-governance"];
    const errors = checkFolderCoverage(folders, indexed);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain("step-99-missing");
  });

  it("all folders indexed = PASS", () => {
    const folders = ["step-01-governance", "step-02-skeleton"];
    const indexed = ["step-01-governance", "step-02-skeleton"];
    const errors = checkFolderCoverage(folders, indexed);
    expect(errors.length).toBe(0);
  });
});

describe("review-reports-index: status validation", () => {
  it("unknown status = FAIL", () => {
    const entry: IndexEntry = { name: "step-01", status: "DONE", supersededBy: "", evidencePath: "" };
    const errors = validateEntry(entry, []);
    expect(errors.some((e) => e.includes("Invalid status") || e.includes("Banned status"))).toBe(true);
  });

  it("ACTIVE_EVIDENCE without evidence path = FAIL", () => {
    const entry: IndexEntry = { name: "step-12", status: "ACTIVE_EVIDENCE", supersededBy: "", evidencePath: "nothing here" };
    const errors = validateEntry(entry, []);
    expect(errors.some((e) => e.includes("ACTIVE_EVIDENCE without evidence"))).toBe(true);
  });

  it("ACTIVE_EVIDENCE with evidence path = PASS", () => {
    const entry: IndexEntry = { name: "step-12", status: "ACTIVE_EVIDENCE", supersededBy: "", evidencePath: "Evidence: STEP_12_REPORT.md" };
    const errors = validateEntry(entry, []);
    expect(errors.length).toBe(0);
  });

  it("SUPERSEDED without Superseded by = FAIL", () => {
    const entry: IndexEntry = { name: "step-05", status: "SUPERSEDED", supersededBy: "—", evidencePath: "" };
    const errors = validateEntry(entry, []);
    expect(errors.some((e) => e.includes("SUPERSEDED without Superseded by"))).toBe(true);
  });

  it("SUPERSEDED with Superseded by = PASS", () => {
    const entry: IndexEntry = { name: "step-05", status: "SUPERSEDED", supersededBy: "step-12-ci-fix", evidencePath: "" };
    const errors = validateEntry(entry, []);
    expect(errors.length).toBe(0);
  });

  it("HISTORICAL_REPORT is valid", () => {
    const entry: IndexEntry = { name: "step-02", status: "HISTORICAL_REPORT", supersededBy: "step-13", evidencePath: "" };
    const errors = validateEntry(entry, []);
    expect(errors.length).toBe(0);
  });

  it("BRAMKA_COMPLETE is banned", () => {
    const entry: IndexEntry = { name: "step-99", status: "BRAMKA_COMPLETE", supersededBy: "", evidencePath: "" };
    const errors = validateEntry(entry, []);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("review-reports-index: table parsing", () => {
  it("parses valid table line", () => {
    const line = "| step-16-secret-scanner | Secret scanner gate | 983255f | 2026-05 | Yes | ACTIVE_EVIDENCE | — | Evidence: STEP_16_REPORT.md |";
    const entry = parseTableLine(line);
    expect(entry).not.toBeNull();
    expect(entry!.name).toBe("step-16-secret-scanner");
    expect(entry!.status).toBe("ACTIVE_EVIDENCE");
  });

  it("returns null for short line", () => {
    const entry = parseTableLine("| too | short |");
    expect(entry).toBeNull();
  });
});
