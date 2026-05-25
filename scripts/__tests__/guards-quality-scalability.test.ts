import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const TMP_DIR = join(ROOT, "scripts/__tests__/fixtures/guards");

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function runGuard(script) {
  try {
    const out = execSync(`node scripts/${script}`, { encoding: "utf-8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"] });
    return { exitCode: 0, stdout: out, stderr: "" };
  } catch (err) {
    return { exitCode: err.status, stdout: err.stdout || "", stderr: err.stderr || "" };
  }
}

describe("check-code-quality-structure", () => {
  it("PASS on current codebase", () => {
    const result = runGuard("check-code-quality-structure.mjs");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_CODE_QUALITY_STRUCTURE_PASS");
  });
});

describe("check-scalability-patterns", () => {
  it("PASS on current codebase", () => {
    const result = runGuard("check-scalability-patterns.mjs");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_SCALABILITY_PATTERNS_PASS");
  });
});

describe("check-frontend-performance-patterns", () => {
  it("PASS on current codebase", () => {
    const result = runGuard("check-frontend-performance-patterns.mjs");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_FRONTEND_PERFORMANCE_PATTERNS_PASS");
  });
});

describe("check-status-truth-consistency", () => {
  it("PASS on current codebase", () => {
    const result = runGuard("check-status-truth-consistency.mjs");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_STATUS_TRUTH_CONSISTENCY_PASS");
  });
});

describe("check-dependency-discipline", () => {
  it("PASS on current codebase", () => {
    const result = runGuard("check-dependency-discipline.mjs");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_DEPENDENCY_DISCIPLINE_PASS");
  });
});

describe("check-logging-pii-security", () => {
  it("PASS on current codebase", () => {
    const result = runGuard("check-logging-pii-security.mjs");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_LOGGING_PII_SECURITY_PASS");
  });
});

describe("audit-domain-boundaries (strengthened)", () => {
  it("PASS on current codebase", () => {
    const result = runGuard("audit-domain-boundaries.mjs");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AUDIT_DOMAIN_BOUNDARIES_PASS");
  });
});
