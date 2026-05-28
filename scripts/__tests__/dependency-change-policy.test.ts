import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const GUARD_SRC = readFileSync(
  join(ROOT, "scripts/check-dependency-change-policy.mjs"),
  "utf-8",
);

function runGuard() {
  try {
    const out = execSync("node scripts/check-dependency-change-policy.mjs", {
      encoding: "utf-8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, stdout: out, stderr: "" };
  } catch (err: any) {
    return { exitCode: err.status, stdout: err.stdout || "", stderr: err.stderr || "" };
  }
}

describe("check-dependency-change-policy", () => {
  it("PASS on current codebase (no undocumented dependency changes)", () => {
    const result = runGuard();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_DEPENDENCY_CHANGE_POLICY_PASS");
  });

  it("requires a DEPENDENCY_DECISION when package.json/lockfile add a dependency", () => {
    expect(GUARD_SRC).toContain("DEPENDENCY_DECISION");
    expect(GUARD_SRC).toContain("package.json");
    expect(GUARD_SRC).toContain("DEPENDENCY_CHANGE_VIOLATION");
  });
});
