import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const FIXTURE_DIR = join(ROOT, "scripts/__tests__/fixtures/arch-import");

function runGuard() {
  try {
    const out = execSync("node scripts/check-architecture-import-graph.mjs", {
      encoding: "utf-8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, stdout: out, stderr: "" };
  } catch (err: any) {
    return { exitCode: err.status, stdout: err.stdout || "", stderr: err.stderr || "" };
  }
}

describe("check-architecture-import-graph", () => {
  it("PASS on current codebase (no circular deps, no forbidden imports)", () => {
    const result = runGuard();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_ARCHITECTURE_IMPORT_GRAPH_PASS");
  });
});
