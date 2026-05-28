import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { join } from "node:path";

const ROOT = process.cwd();

function run(script: string): { code: number; stdout: string; stderr: string } {
  try {
    const stdout = execSync(`node "${join(ROOT, "scripts", script)}"`, {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { code: 0, stdout, stderr: "" };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}

describe("new structural guards — smoke (current repo passes)", () => {
  it("check-public-api-surface.mjs passes", () => {
    expect(run("check-public-api-surface.mjs").code).toBe(0);
  });

  it("check-application-use-cases-boundary.mjs passes", () => {
    expect(run("check-application-use-cases-boundary.mjs").code).toBe(0);
  });

  it("check-public-dto-contract-tests.mjs passes", () => {
    expect(run("check-public-dto-contract-tests.mjs").code).toBe(0);
  });

  it("check-branded-id-types.mjs passes", () => {
    expect(run("check-branded-id-types.mjs").code).toBe(0);
  });

  it("check-correlation-id-boundary.mjs passes", () => {
    expect(run("check-correlation-id-boundary.mjs").code).toBe(0);
  });

  it("check-backend-ownership-invariants.mjs passes", () => {
    expect(run("check-backend-ownership-invariants.mjs").code).toBe(0);
  });

  it("check-read-model-single-owner.mjs passes", () => {
    expect(run("check-read-model-single-owner.mjs").code).toBe(0);
  });

  it("check-idempotency-flows.mjs passes", () => {
    expect(run("check-idempotency-flows.mjs").code).toBe(0);
  });

  it("check-no-unsafe-randomness.mjs passes", () => {
    expect(run("check-no-unsafe-randomness.mjs").code).toBe(0);
  });
});
