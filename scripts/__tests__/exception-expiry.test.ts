import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const GUARD_SRC = readFileSync(
  join(ROOT, "scripts/check-exception-expiry.mjs"),
  "utf-8",
);

function runGuard() {
  try {
    const out = execSync("node scripts/check-exception-expiry.mjs", {
      encoding: "utf-8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, stdout: out, stderr: "" };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { exitCode: e.status ?? 1, stdout: e.stdout || "", stderr: e.stderr || "" };
  }
}

describe("check-exception-expiry", () => {
  it("PASS on current codebase (no active exceptions)", () => {
    const result = runGuard();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_EXCEPTION_EXPIRY_PASS");
  });

  it("requires every exception to carry the mandatory fields", () => {
    expect(GUARD_SRC).toContain("REQUIRED_FIELDS");
    expect(GUARD_SRC).toContain("missing required field");
    expect(GUARD_SRC).toMatch(/expiry/);
    expect(GUARD_SRC).toMatch(/owner/);
  });

  it("fails active exceptions that are past their expiry date", () => {
    expect(GUARD_SRC).toContain("expiryDate < new Date()");
    expect(GUARD_SRC).toContain("must be revoked");
    expect(GUARD_SRC).toContain("must be time-bound");
  });
});
