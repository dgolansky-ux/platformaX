import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const GUARD_SRC = readFileSync(
  join(ROOT, "scripts/check-architecture-import-graph.mjs"),
  "utf-8",
);

function runGuard() {
  try {
    const out = execSync("node scripts/check-architecture-import-graph.mjs", {
      encoding: "utf-8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, stdout: out, stderr: "" };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { exitCode: e.status ?? 1, stdout: e.stdout || "", stderr: e.stderr || "" };
  }
}

describe("check-architecture-import-graph", () => {
  it("PASS on current codebase (no circular deps, no forbidden imports)", () => {
    const result = runGuard();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_ARCHITECTURE_IMPORT_GRAPH_PASS");
  });

  it("flags forbidden cross-domain repository/service/internal imports", () => {
    expect(GUARD_SRC).toContain("FORBIDDEN_CROSS_DOMAIN_FILES");
    expect(GUARD_SRC).toContain("FORBIDDEN_CROSS_DOMAIN_DIRS");
    expect(GUARD_SRC).toContain("ARCH_IMPORT_VIOLATION");
    expect(GUARD_SRC).toMatch(/repository/);
  });

  it("allows cross-domain imports via public-api/contracts/events", () => {
    expect(GUARD_SRC).toContain("ALLOWED_CROSS_DOMAIN_FILES");
    expect(GUARD_SRC).toContain("public-api");
  });

  it("detects circular cross-domain dependencies", () => {
    expect(GUARD_SRC).toContain("findCycles");
    expect(GUARD_SRC).toContain("ARCH_CYCLE_VIOLATION");
  });
});
