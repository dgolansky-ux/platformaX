import { describe, it, expect } from "vitest";

const FORBIDDEN_STATUSES = [
  "VISUAL_DONE",
  "BACKEND_DONE",
  "FULL_DONE",
  "BRAMKA_COMPLETE",
  "CURRENT_V2_SCOPE_CLEAN",
  "READY_FOR_PRODUCTION",
  "PRODUCTION_READY",
];

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

function checkStatusTerm(content: string, allowlistMarker: string): string[] {
  if (content.includes(allowlistMarker)) return [];
  return FORBIDDEN_STATUSES.filter((term) => content.includes(term));
}

describe("status-truth: fake-done detection", () => {
  it("detects forbidden status terms", () => {
    const violations = checkStatusTerm("Status: FULL_DONE", "ALLOW_STATUS_TERM_IN_POLICY_DOC");
    expect(violations).toContain("FULL_DONE");
  });

  it("skips files with allowlist marker", () => {
    const violations = checkStatusTerm(
      "FULL_DONE ALLOW_STATUS_TERM_IN_POLICY_DOC",
      "ALLOW_STATUS_TERM_IN_POLICY_DOC",
    );
    expect(violations).toHaveLength(0);
  });

  it("passes clean content", () => {
    const violations = checkStatusTerm("Status: PLANNED", "ALLOW_STATUS_TERM_IN_POLICY_DOC");
    expect(violations).toHaveLength(0);
  });

  it("validates allowed statuses are not in forbidden list", () => {
    for (const status of ALLOWED_STATUSES) {
      expect(FORBIDDEN_STATUSES).not.toContain(status);
    }
  });
});
