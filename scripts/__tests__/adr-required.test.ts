import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const GUARD_SRC = readFileSync(
  join(ROOT, "scripts/check-adr-required.mjs"),
  "utf-8",
);

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

  it("requires an ADR IMPACT DECISION when architecture-impacting files change", () => {
    expect(GUARD_SRC).toContain("ADR IMPACT DECISION");
    expect(GUARD_SRC).toContain("ARCHITECTURE_IMPACTING_PATTERNS");
    expect(GUARD_SRC).toContain("ADR_REQUIRED_VIOLATION");
    expect(GUARD_SRC).toContain("public-api");
  });
});
