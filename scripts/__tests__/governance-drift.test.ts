import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const FIXTURE_DIR = join(ROOT, "scripts/__tests__/fixtures/drift-test");

function runGuard() {
  try {
    const out = execSync("node scripts/check-governance-drift.mjs", {
      encoding: "utf-8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, stdout: out, stderr: "" };
  } catch (err: any) {
    return { exitCode: err.status, stdout: err.stdout || "", stderr: err.stderr || "" };
  }
}

describe("check-governance-drift", () => {
  it("PASS on current codebase (no governance drift)", () => {
    const result = runGuard();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_GOVERNANCE_DRIFT_PASS");
  });
});
