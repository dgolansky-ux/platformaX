import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const GUARD_SRC = readFileSync(
  join(ROOT, "scripts/check-scalability-hot-paths.mjs"),
  "utf-8",
);

function runGuard() {
  try {
    const out = execSync("node scripts/check-scalability-hot-paths.mjs", {
      encoding: "utf-8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, stdout: out, stderr: "" };
  } catch (err: any) {
    return { exitCode: err.status, stdout: err.stdout || "", stderr: err.stderr || "" };
  }
}

describe("check-scalability-hot-paths", () => {
  it("PASS on current codebase (no hot-path violations)", () => {
    const result = runGuard();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_SCALABILITY_HOT_PATHS_PASS");
  });

  it("checks for sync fanout loops in service/router/public-api", () => {
    expect(GUARD_SRC).toContain("sync-fanout-loop");
    expect(GUARD_SRC).toContain("recipients");
  });

  it("checks for unbounded hot-path loops without cap/batch/outbox", () => {
    expect(GUARD_SRC).toContain("unbounded-hot-loop");
    expect(GUARD_SRC).toMatch(/BATCH_SIZE|outbox|queue|chunk/);
  });

  it("checks that full scans require limit/cursor pagination", () => {
    expect(GUARD_SRC).toContain("full-scan-runtime");
    expect(GUARD_SRC).toContain("paginationMarkers");
    expect(GUARD_SRC).toMatch(/limit|cursor/);
  });
});
