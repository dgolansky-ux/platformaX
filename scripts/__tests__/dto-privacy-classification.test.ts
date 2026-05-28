import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const GUARD_SRC = readFileSync(
  join(ROOT, "scripts/check-dto-privacy-classification.mjs"),
  "utf-8",
);

function runGuard() {
  try {
    const out = execSync("node scripts/check-dto-privacy-classification.mjs", {
      encoding: "utf-8", cwd: ROOT, stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, stdout: out, stderr: "" };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { exitCode: e.status ?? 1, stdout: e.stdout || "", stderr: e.stderr || "" };
  }
}

describe("check-dto-privacy-classification", () => {
  it("PASS on current codebase (all DTOs have classification or are scaffold)", () => {
    const result = runGuard();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_DTO_PRIVACY_CLASSIFICATION_PASS");
  });

  it("flags PII fields declared inside a Public DTO", () => {
    expect(GUARD_SRC).toContain("PII_FIELDS");
    expect(GUARD_SRC).toContain("PII field");
    expect(GUARD_SRC).toMatch(/email|phone|dateOfBirth/);
  });

  it("skips scaffold-only DTO files", () => {
    expect(GUARD_SRC).toContain("SCAFFOLD_ONLY");
  });
});
