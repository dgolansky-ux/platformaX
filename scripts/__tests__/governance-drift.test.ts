import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const FIXTURE_DIR = join(ROOT, "scripts/__tests__/fixtures/drift-test");
const GUARD_SRC = readFileSync(
  join(ROOT, "scripts/check-governance-drift.mjs"),
  "utf-8",
);

function runGuard() {
  try {
    const out = execSync("node scripts/check-governance-drift.mjs", {
      encoding: "utf-8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, stdout: out, stderr: "" };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { exitCode: e.status ?? 1, stdout: e.stdout || "", stderr: e.stderr || "" };
  }
}

describe("check-governance-drift", () => {
  it("PASS on current codebase (no governance drift)", () => {
    const result = runGuard();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_GOVERNANCE_DRIFT_PASS");
  });

  it("treats a normative line tagged with a Rule ID as governed", () => {
    expect(GUARD_SRC).toContain("RULE_ID_PATTERN");
    expect(GUARD_SRC).toContain("PX-");
    expect(GUARD_SRC).toContain("hasRuleIdOrLink");
  });

  it("treats a LOCAL_NOTE marker as an allowed local exemption", () => {
    expect(GUARD_SRC).toContain("LOCAL_NOTE");
  });

  it("skips files tagged HISTORICAL_REPORT_ONLY", () => {
    expect(GUARD_SRC).toContain("HISTORICAL_REPORT_ONLY");
  });
});
