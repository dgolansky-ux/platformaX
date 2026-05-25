import { describe, it, expect } from "vitest";

const SELF_AUDIT_MARKER = "SELF-AUDIT / INDEPENDENT REVIEW PASS";
const HISTORICAL_MARKER = "HISTORICAL_REPORT_NO_SELF_AUDIT";
const ENFORCEMENT_START_STEP = 17;

const REQUIRED_FIELDS = [
  "What I changed",
  "What I might have broken",
  "Domain boundaries affected",
  "Cross-domain imports check",
  "Legacy/runtime check",
  "Fake DONE/status truth check",
  "PII/base64/secrets check",
  "Routes/nav/build graph check",
  "Guard weakening check",
  "Evidence reviewed",
  "Gates run",
  "Remaining risks",
];

interface CheckResult {
  valid: boolean;
  reason: string;
}

function checkSelfAudit(content: string, stepNum: number): CheckResult {
  if (stepNum < ENFORCEMENT_START_STEP) {
    return { valid: true, reason: "Pre-enforcement step" };
  }

  if (content.includes(HISTORICAL_MARKER)) {
    return { valid: true, reason: "Historical marker present" };
  }

  if (!content.includes(SELF_AUDIT_MARKER)) {
    return { valid: false, reason: "Missing SELF-AUDIT section" };
  }

  const missing = REQUIRED_FIELDS.filter((f) => !content.includes(f));
  if (missing.length > 0) {
    return { valid: false, reason: `Missing fields: ${missing.join(", ")}` };
  }

  return { valid: true, reason: "All fields present" };
}

describe("self-audit-evidence: new report without SELF-AUDIT = FAIL", () => {
  it("step 17 report without section fails", () => {
    const content = "# Step 17 Report\n\nSome content without self-audit.";
    const result = checkSelfAudit(content, 17);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Missing SELF-AUDIT section");
  });

  it("step 18 report without section fails", () => {
    const content = "# Step 18 Report\n\nContent.";
    const result = checkSelfAudit(content, 18);
    expect(result.valid).toBe(false);
  });
});

describe("self-audit-evidence: report with SELF-AUDIT but missing Evidence = FAIL", () => {
  it("missing Evidence reviewed field fails", () => {
    const content = `# Report\n\n## SELF-AUDIT / INDEPENDENT REVIEW PASS\n\nWhat I changed: files\nWhat I might have broken: nothing\nDomain boundaries affected: none\nCross-domain imports check: clean\nLegacy/runtime check: clean\nFake DONE/status truth check: clean\nPII/base64/secrets check: clean\nRoutes/nav/build graph check: clean\nGuard weakening check: none\nGates run: all pass\nRemaining risks: none`;
    const result = checkSelfAudit(content, 17);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Missing fields");
    expect(result.reason).toContain("Evidence reviewed");
  });
});

describe("self-audit-evidence: report with full SELF-AUDIT = PASS", () => {
  it("complete section passes", () => {
    const fields = REQUIRED_FIELDS.map((f) => `${f}: PASS`).join("\n");
    const content = `# Report\n\n## SELF-AUDIT / INDEPENDENT REVIEW PASS\n\n${fields}`;
    const result = checkSelfAudit(content, 17);
    expect(result.valid).toBe(true);
    expect(result.reason).toBe("All fields present");
  });
});

describe("self-audit-evidence: historical report with marker = PASS", () => {
  it("historical marker bypasses check", () => {
    const content = "# Report\n\nHISTORICAL_REPORT_NO_SELF_AUDIT\n\nOld content.";
    const result = checkSelfAudit(content, 17);
    expect(result.valid).toBe(true);
    expect(result.reason).toBe("Historical marker present");
  });
});

describe("self-audit-evidence: pre-enforcement steps", () => {
  it("step 16 always passes", () => {
    const result = checkSelfAudit("nothing", 16);
    expect(result.valid).toBe(true);
    expect(result.reason).toBe("Pre-enforcement step");
  });

  it("step 1 always passes", () => {
    const result = checkSelfAudit("", 1);
    expect(result.valid).toBe(true);
  });
});
