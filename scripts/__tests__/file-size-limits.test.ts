import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Unit test for scripts/check-file-size-limits.mjs.
 *
 * The guard scans `client/src`, `server`, `shared` relative to `cwd()` and
 * fails when any `.module.css` exceeds 320 lines (or any global `.css` exceeds
 * 500). We run the guard as a subprocess inside a temp cwd so the fixtures are
 * isolated from the real repo, and assert exit code + emitted output.
 */
const GUARD = join(process.cwd(), "scripts/check-file-size-limits.mjs");

function runGuard(cwd: string) {
  return spawnSync(process.execPath, [GUARD], {
    cwd,
    encoding: "utf-8",
    env: { ...process.env, NODE_OPTIONS: "" },
  });
}

let tmp: string;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "px-fsl-"));
  mkdirSync(join(tmp, "client/src"), { recursive: true });
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe("check-file-size-limits.mjs", () => {
  it("PASS: a CSS module under the 320 line limit does not fail", () => {
    const lines = Array.from({ length: 200 }, (_, i) => `.line${i} { color: red; }`).join("\n");
    writeFileSync(join(tmp, "client/src/small.module.css"), lines);
    const res = runGuard(tmp);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("CHECK_FILE_SIZE_LIMITS_PASS");
  });

  it("FAIL: a CSS module above the 320 line limit triggers FILE_SIZE_VIOLATION", () => {
    const lines = Array.from({ length: 400 }, (_, i) => `.line${i} { color: red; }`).join("\n");
    writeFileSync(join(tmp, "client/src/huge.module.css"), lines);
    const res = runGuard(tmp);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain("FILE_SIZE_VIOLATION");
    expect(res.stderr).toContain("huge.module.css");
    expect(res.stderr).toContain("CSS module limit: 320");
  });

  it("FAIL: a global .css above the 500 line limit triggers FILE_SIZE_VIOLATION", () => {
    const lines = Array.from({ length: 700 }, (_, i) => `.line${i} { color: red; }`).join("\n");
    writeFileSync(join(tmp, "client/src/huge.css"), lines);
    const res = runGuard(tmp);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain("FILE_SIZE_VIOLATION");
    expect(res.stderr).toContain("global CSS limit: 500");
  });

  it("PLATFORMAX_EXCEPTION block skips the file", () => {
    const header = `/*
PLATFORMAX_EXCEPTION:
Rule: PX-CODE-001
Scope: client/src/exception.module.css
Reason: fixture proving exception behavior
Risk: none; temp test fixture
Owner: engineering
Expiry: 2026-12-31
Removal plan: delete fixture after test
Evidence: file-size-limits.test.ts
*/`;
    const body = Array.from({ length: 600 }, (_, i) => `.line${i} { color: red; }`).join("\n");
    writeFileSync(join(tmp, "client/src/exception.module.css"), `${header}\n${body}`);
    const res = runGuard(tmp);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("CHECK_FILE_SIZE_LIMITS_PASS");
  });

  it("ACTUAL repo: every profile CSS module is under 320 lines or has registered exception", () => {
    const profileDir = join(process.cwd(), "client/src/app-v2/profile/styles");
    for (const f of [
      "profile-layout.module.css",
      "profile-header.module.css",
      "profile-status.module.css",
      "profile-sections.module.css",
      "profile-portal.module.css",
      "profile-professional.module.css",
      "profile-feed-preview.module.css",
    ]) {
      const fp = join(profileDir, f);
      const stat = statSync(fp);
      expect(stat.isFile()).toBe(true);
      const content = require("fs").readFileSync(fp, "utf-8") as string;
      const lineCount = content.split("\n").length;
      const hasException =
        content.includes("PLATFORMAX_EXCEPTION:") ||
        content.includes("QUALITY_STRUCTURE_EXCEPTION") ||
        content.includes("ALLOW_FILE_SIZE_EXCEPTION");
      expect(
        lineCount <= 320 || hasException,
        `${f} has ${lineCount} lines (limit 320) without exception marker`,
      ).toBe(true);
    }
  });
});
