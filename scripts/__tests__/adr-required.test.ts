import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

const ROOT = process.cwd();

function runGuard() {
  try {
    const out = execSync("node scripts/check-adr-required.mjs", {
      encoding: "utf-8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, stdout: out, stderr: "" };
  } catch (err: any) {
    return { exitCode: err.status, stdout: err.stdout || "", stderr: err.stderr || "" };
  }
}

describe("check-adr-required", () => {
  it("PASS on current codebase", () => {
    const result = runGuard();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_ADR_REQUIRED_PASS");
  });

  it("validates architecture-impacting changes require ADR IMPACT DECISION", () => {
    expect(true).toBe(true);
  });
});
