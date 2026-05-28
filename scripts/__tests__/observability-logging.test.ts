import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const GUARD_SRC = readFileSync(
  join(ROOT, "scripts/check-observability-logging.mjs"),
  "utf-8",
);

function runGuard() {
  try {
    const out = execSync("node scripts/check-observability-logging.mjs", {
      encoding: "utf-8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, stdout: out, stderr: "" };
  } catch (err: any) {
    return { exitCode: err.status, stdout: err.stdout || "", stderr: err.stderr || "" };
  }
}

describe("check-observability-logging", () => {
  it("PASS on current codebase (no unsafe logging)", () => {
    const result = runGuard();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_OBSERVABILITY_LOGGING_PASS");
  });

  it("flags console.log / console.debug in runtime code", () => {
    expect(GUARD_SRC).toContain("CONSOLE_PATTERNS");
    expect(GUARD_SRC).toContain("console\\.log");
    expect(GUARD_SRC).toContain("LOGGING_VIOLATION");
  });

  it("flags PII fields appearing in log/error output", () => {
    expect(GUARD_SRC).toContain("PII_LOG_PATTERNS");
    expect(GUARD_SRC).toContain("PII_LOG_VIOLATION");
    expect(GUARD_SRC).toMatch(/email|phone|token/);
  });
});
