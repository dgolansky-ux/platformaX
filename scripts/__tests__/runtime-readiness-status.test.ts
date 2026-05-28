import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const GUARD_SRC = readFileSync(
  join(ROOT, "scripts/check-runtime-readiness-status.mjs"),
  "utf-8",
);

function runGuard() {
  try {
    const out = execSync("node scripts/check-runtime-readiness-status.mjs", {
      encoding: "utf-8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, stdout: out, stderr: "" };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { exitCode: e.status ?? 1, stdout: e.stdout || "", stderr: e.stderr || "" };
  }
}

describe("check-runtime-readiness-status", () => {
  it("PASS on current codebase (PARTIAL domains have real runtime)", () => {
    const result = runGuard();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_RUNTIME_READINESS_STATUS_PASS");
  });

  it("enforces that PARTIAL domains have service.ts, tests and public-api.ts", () => {
    expect(GUARD_SRC).toContain('status === "PARTIAL"');
    expect(GUARD_SRC).toContain('"service.ts"');
    expect(GUARD_SRC).toContain('"public-api.ts"');
    expect(GUARD_SRC).toContain("domainHasTests");
    expect(GUARD_SRC).toContain("missing service.ts");
  });

  it("enforces full runtime evidence for IMPLEMENTED / BACKEND_DONE domains", () => {
    expect(GUARD_SRC).toContain('"IMPLEMENTED"');
    expect(GUARD_SRC).toContain('"repository.ts"');
    expect(GUARD_SRC).toContain('"policy.ts"');
    expect(GUARD_SRC).toContain("requiredFiles");
  });
});
