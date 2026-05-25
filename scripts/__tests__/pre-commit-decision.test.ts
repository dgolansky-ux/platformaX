import { describe, it, expect } from "vitest";

const PRE_COMMIT_DECISION_MARKER = "PRE-COMMIT DECISION";
const HISTORICAL_MARKER = "HISTORICAL_REPORT_NO_PRE_COMMIT_DECISION";
const ENFORCEMENT_START_STEP = 17;

const PRE_COMMIT_REQUIRED_FIELDS = [
  "Changed files:",
  "Domains touched:",
  "Cross-domain imports:",
  "Legacy runtime imports:",
  "Removed routes/nav/build chunks:",
  "Public DTO PII:",
  "Media base64/dataUrl:",
  "List pagination/limit/cursor:",
  "Fake DONE/status truth:",
  "Env safety:",
  "TypeScript:",
  "V2 lint:",
  "Tests:",
  "Build:",
  "Commit decision:",
];

interface CheckResult {
  valid: boolean;
  reason: string;
}

function checkPreCommitDecision(content: string, stepNum: number): CheckResult {
  if (content.includes(HISTORICAL_MARKER)) {
    return { valid: true, reason: "Historical marker present" };
  }

  if (stepNum < ENFORCEMENT_START_STEP) {
    return { valid: true, reason: "Pre-enforcement step" };
  }

  if (!content.includes(PRE_COMMIT_DECISION_MARKER)) {
    return { valid: false, reason: "Missing PRE-COMMIT DECISION section" };
  }

  const missing = PRE_COMMIT_REQUIRED_FIELDS.filter((f) => !content.includes(f));
  if (missing.length > 0) {
    return { valid: false, reason: `Missing fields: ${missing.join(", ")}` };
  }

  return { valid: true, reason: "All fields present" };
}

describe("pre-commit-decision: enforcement", () => {
  it("new report (step 17+) without PRE-COMMIT DECISION = FAIL", () => {
    const content = "# Step 17 Report\n\nSome content without the section.";
    const result = checkPreCommitDecision(content, 17);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Missing PRE-COMMIT DECISION");
  });

  it("new report (step 18) without PRE-COMMIT DECISION = FAIL", () => {
    const content = "# Step 18 Report\n\nSome content.";
    const result = checkPreCommitDecision(content, 18);
    expect(result.valid).toBe(false);
  });

  it("old report (step 16) without PRE-COMMIT DECISION = PASS", () => {
    const content = "# Step 16 Report\n\nNo decision section.";
    const result = checkPreCommitDecision(content, 16);
    expect(result.valid).toBe(true);
    expect(result.reason).toBe("Pre-enforcement step");
  });

  it("historical report with marker = PASS", () => {
    const content = "# Step 17 Report\n\nHISTORICAL_REPORT_NO_PRE_COMMIT_DECISION\n\nContent.";
    const result = checkPreCommitDecision(content, 17);
    expect(result.valid).toBe(true);
    expect(result.reason).toBe("Historical marker present");
  });
});

describe("pre-commit-decision: field validation", () => {
  it("report with PRE-COMMIT DECISION but missing fields = FAIL", () => {
    const content = "# Step 17 Report\n\n## PRE-COMMIT DECISION\n\nChanged files: yes\nBuild: pass";
    const result = checkPreCommitDecision(content, 17);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Missing fields");
  });

  it("report with full PRE-COMMIT DECISION = PASS", () => {
    const fields = PRE_COMMIT_REQUIRED_FIELDS.map((f) => `${f} PASS`).join("\n");
    const content = `# Step 17 Report\n\n## PRE-COMMIT DECISION\n\n${fields}`;
    const result = checkPreCommitDecision(content, 17);
    expect(result.valid).toBe(true);
    expect(result.reason).toBe("All fields present");
  });
});

describe("pre-commit-decision: edge cases", () => {
  it("step 1 always passes", () => {
    const result = checkPreCommitDecision("", 1);
    expect(result.valid).toBe(true);
  });

  it("step 16 always passes (just below threshold)", () => {
    const result = checkPreCommitDecision("nothing", 16);
    expect(result.valid).toBe(true);
  });

  it("step 17 with all required fields passes", () => {
    const fields = PRE_COMMIT_REQUIRED_FIELDS.map((f) => `${f} N/A`).join("\n");
    const content = `# Report\n\n## PRE-COMMIT DECISION\n\n${fields}`;
    const result = checkPreCommitDecision(content, 17);
    expect(result.valid).toBe(true);
  });
});
