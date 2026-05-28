import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const FIXTURE_DIR = join(ROOT, "supabase/migrations/__test_fixtures__");

function runGuard() {
  try {
    const out = execSync("node scripts/check-migration-safety.mjs", {
      encoding: "utf-8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, stdout: out, stderr: "" };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { exitCode: e.status ?? 1, stdout: e.stdout || "", stderr: e.stderr || "" };
  }
}

describe("check-migration-safety", () => {
  it("PASS on current codebase (no destructive patterns)", () => {
    const result = runGuard();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_MIGRATION_SAFETY_PASS");
  });

  it("FAIL on DROP TABLE without approval marker", () => {
    mkdirSync(FIXTURE_DIR, { recursive: true });
    writeFileSync(
      join(FIXTURE_DIR, "20990101_test_drop.sql"),
      "DROP TABLE users;\n"
    );

    try {
      const result = runGuard();
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("MIGRATION_SAFETY_VIOLATION");
      expect(result.stderr).toContain("DROP TABLE");
    } finally {
      rmSync(FIXTURE_DIR, { recursive: true, force: true });
    }
  });

  it("PASS on DROP TABLE with MIGRATION_APPROVED marker", () => {
    mkdirSync(FIXTURE_DIR, { recursive: true });
    writeFileSync(
      join(FIXTURE_DIR, "20990101_test_drop_approved.sql"),
      "-- MIGRATION_APPROVED: owner decision 2026-05-20\nDROP TABLE old_temp_table;\n"
    );

    try {
      const result = runGuard();
      expect(result.exitCode).toBe(0);
    } finally {
      rmSync(FIXTURE_DIR, { recursive: true, force: true });
    }
  });
});
