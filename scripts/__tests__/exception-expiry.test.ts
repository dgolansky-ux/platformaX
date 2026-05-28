import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import {
  evaluateExceptionsRegister,
  hasCanonicalExceptionBlock,
} from "../check-exception-expiry.mjs";

const ROOT = process.cwd();

function runGuard() {
  try {
    const out = execSync("node scripts/check-exception-expiry.mjs", {
      encoding: "utf-8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, stdout: out, stderr: "" };
  } catch (err: any) {
    return { exitCode: err.status, stdout: err.stdout || "", stderr: err.stderr || "" };
  }
}

describe("check-exception-expiry", () => {
  it("PASS on current codebase (no active exceptions)", () => {
    const result = runGuard();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_EXCEPTION_EXPIRY_PASS");
  });

  it("PASS: full PLATFORMAX_EXCEPTION block is recognized", () => {
    expect(
      hasCanonicalExceptionBlock(`// PLATFORMAX_EXCEPTION:
// Rule: PX-CODE-001
// Scope: x
// Reason: y
// Risk: z
// Owner: engineering
// Expiry: 2026-12-31
// Removal plan: split
// Evidence: test`),
    ).toBe(true);
  });

  it("FAIL: ALLOW_FILE_SIZE_EXCEPTION alone has no owner/expiry/removal plan", () => {
    expect(hasCanonicalExceptionBlock("/* ALLOW_FILE_SIZE_EXCEPTION */")).toBe(
      false,
    );
  });

  it("FAIL: exception register entry without expiry is detected", () => {
    const result = evaluateExceptionsRegister(`
| Exception ID | Rule ID | File / Scope | Reason | Expiry | Owner | Evidence | Risk | Status |
|---|---|---|---|---|---|---|---|---|
| EXC-999 | PX-CODE-001 | x.ts | temporary | - | engineering | report | drift | active |
`);
    expect(result.violations.join("\n")).toContain("has no expiry date");
  });

  it("FAIL: exception register entry without rule ID is detected", () => {
    const result = evaluateExceptionsRegister(`
| Exception ID | Rule ID | File / Scope | Reason | Expiry | Owner | Evidence | Risk | Status |
|---|---|---|---|---|---|---|---|---|
| EXC-999 | - | x.ts | temporary | 2026-12-31 | engineering | report | drift | active |
`);
    expect(result.violations.join("\n")).toContain("has no rule ID");
  });
});
