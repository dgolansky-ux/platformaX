import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const SCRIPT_PATH = join(ROOT, "scripts/check-pr-merge-eligibility.mjs");

describe("pr-merge-eligibility script", () => {
  it("script file exists", () => {
    expect(existsSync(SCRIPT_PATH)).toBe(true);
  });

  it("script requires PR number argument", () => {
    const content = readFileSync(SCRIPT_PATH, "utf-8");
    expect(/process\.argv\[2\]/.test(content)).toBe(true);
  });

  it("script checks baseRefName === main", () => {
    const content = readFileSync(SCRIPT_PATH, "utf-8");
    expect(/baseRefName/.test(content)).toBe(true);
    expect(/main/.test(content)).toBe(true);
  });

  it("script checks headRefName !== main", () => {
    const content = readFileSync(SCRIPT_PATH, "utf-8");
    expect(/headRefName/.test(content)).toBe(true);
  });

  it("script checks isDraft", () => {
    const content = readFileSync(SCRIPT_PATH, "utf-8");
    expect(/isDraft/.test(content)).toBe(true);
  });

  it("script checks merge conflicts via mergeStateStatus", () => {
    const content = readFileSync(SCRIPT_PATH, "utf-8");
    expect(/mergeStateStatus/.test(content)).toBe(true);
  });

  it("script checks CI status via statusCheckRollup", () => {
    const content = readFileSync(SCRIPT_PATH, "utf-8");
    expect(/statusCheckRollup/.test(content)).toBe(true);
  });

  it("script checks working tree is clean", () => {
    const content = readFileSync(SCRIPT_PATH, "utf-8");
    expect(/git status/.test(content)).toBe(true);
  });

  it("script does NOT perform merge", () => {
    const content = readFileSync(SCRIPT_PATH, "utf-8");
    expect(/gh\s+pr\s+merge/.test(content)).toBe(false);
  });

  it("script mentions owner instruction requirement", () => {
    const content = readFileSync(SCRIPT_PATH, "utf-8");
    expect(/owner.*instruction|explicit.*owner/i.test(content)).toBe(true);
  });
});
