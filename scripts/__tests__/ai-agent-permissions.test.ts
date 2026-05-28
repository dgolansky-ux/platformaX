import { describe, it, expect } from "vitest";
// @ts-expect-error mjs export
import { checkAllowList, normalize } from "../check-ai-agent-permissions.mjs";

function violations(entries: string[]): string[] {
  return (checkAllowList as (l: string, a: string[]) => string[])("test", entries);
}

describe("ai-agent-permissions guard logic", () => {
  it("normalizes Bash(...) wrappers", () => {
    expect(normalize("Bash(git status)")).toBe("git status");
    expect(normalize("git status")).toBe("git status");
  });

  it("FAIL: git push -u origin * (broad)", () => {
    const v = violations(["Bash(git push -u origin *)"]);
    expect(v.length).toBeGreaterThan(0);
    expect(v.join("\n")).toMatch(/broad git push wildcard/);
  });

  it("FAIL: git push origin *", () => {
    const v = violations(["Bash(git push origin *)"]);
    expect(v.length).toBeGreaterThan(0);
  });

  it("FAIL: git push * (raw)", () => {
    const v = violations(["Bash(git push *)"]);
    expect(v.length).toBeGreaterThan(0);
  });

  it("PASS: git push origin HEAD", () => {
    const v = violations(["Bash(git push origin HEAD)"]);
    expect(v).toEqual([]);
  });

  it("PASS: git push -u origin HEAD", () => {
    const v = violations(["Bash(git push -u origin HEAD)"]);
    expect(v).toEqual([]);
  });

  it("FAIL: git push origin main", () => {
    const v = violations(["Bash(git push origin main)"]);
    expect(v.length).toBeGreaterThan(0);
    expect(v.join("\n")).toMatch(/git push to main/);
  });

  it("FAIL: git push --force", () => {
    const v = violations(["Bash(git push --force)"]);
    expect(v.length).toBeGreaterThan(0);
  });

  it("FAIL: git push -f", () => {
    const v = violations(["Bash(git push -f)"]);
    expect(v.length).toBeGreaterThan(0);
  });

  it("FAIL: --no-verify anywhere", () => {
    const v = violations(["Bash(git commit --no-verify)"]);
    expect(v.length).toBeGreaterThan(0);
    expect(v.join("\n")).toMatch(/--no-verify/);
  });

  it("FAIL: git pull * (no --ff-only)", () => {
    const v = violations(["Bash(git pull *)"]);
    expect(v.length).toBeGreaterThan(0);
  });

  it("PASS: git pull --ff-only *", () => {
    const v = violations(["Bash(git pull --ff-only *)"]);
    expect(v).toEqual([]);
  });

  it("FAIL: gh api * (broad mutable bypass)", () => {
    const v = violations(["Bash(gh api *)"]);
    expect(v.length).toBeGreaterThan(0);
  });

  it("FAIL: gh pr merge", () => {
    const v = violations(["Bash(gh pr merge)"]);
    expect(v.length).toBeGreaterThan(0);
  });

  it("FAIL: node * (broad arbitrary execution)", () => {
    const v = violations(["Bash(node *)"]);
    expect(v.length).toBeGreaterThan(0);
  });

  it("PASS: node scripts/check-ai-agent-permissions.mjs", () => {
    const v = violations(["Bash(node scripts/check-ai-agent-permissions.mjs)"]);
    expect(v).toEqual([]);
  });

  it("FAIL: railway *", () => {
    const v = violations(["Bash(railway up)"]);
    expect(v.length).toBeGreaterThan(0);
  });

  it("FAIL: supabase db push", () => {
    const v = violations(["Bash(supabase db push)"]);
    expect(v.length).toBeGreaterThan(0);
  });

  it("FAIL: rm -rf", () => {
    const v = violations(["Bash(rm -rf node_modules)"]);
    expect(v.length).toBeGreaterThan(0);
  });

  it("FAIL: git reset --hard", () => {
    const v = violations(["Bash(git reset --hard)"]);
    expect(v.length).toBeGreaterThan(0);
  });

  it("FAIL: git checkout -- *", () => {
    const v = violations(["Bash(git checkout -- *)"]);
    expect(v.length).toBeGreaterThan(0);
  });

  it("PASS: safe pnpm entries", () => {
    const v = violations([
      "Bash(pnpm check)",
      "Bash(pnpm lint)",
      "Bash(pnpm rules:check)",
      "Bash(pnpm arch:check:v2)",
      "Bash(pnpm guards:all-local)",
    ]);
    expect(v).toEqual([]);
  });

  it("PASS: safe git read entries", () => {
    const v = violations([
      "Bash(git status)",
      "Bash(git diff)",
      "Bash(git log)",
      "Bash(git branch --show-current)",
      "Bash(git rev-parse --short HEAD)",
      "Bash(git ls-files)",
    ]);
    expect(v).toEqual([]);
  });
});
