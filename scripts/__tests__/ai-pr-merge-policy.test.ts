import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

describe("ai-pr-merge-policy guard logic", () => {
  const policyPath = join(ROOT, "docs/governance/AI_AGENT_PERMISSIONS_POLICY.md");
  const forbiddenPath = join(ROOT, "docs/ai/AI_FORBIDDEN_ACTIONS.md");
  const settingsPath = join(ROOT, ".claude/settings.local.json");

  it("AI_AGENT_PERMISSIONS_POLICY.md exists", () => {
    expect(existsSync(policyPath)).toBe(true);
  });

  it("policy requires explicit owner instruction for merge", () => {
    const policy = readFileSync(policyPath, "utf-8");
    expect(/explicit.*owner.*instruct/i.test(policy)).toBe(true);
  });

  it("policy forbids autonomous AI merge", () => {
    const policy = readFileSync(policyPath, "utf-8");
    expect(/autonomous.*merge.*forbidden|autonomous.*forbidden/i.test(policy)).toBe(true);
  });

  it("policy forbids --admin bypass", () => {
    const policy = readFileSync(policyPath, "utf-8");
    expect(/--admin/.test(policy)).toBe(true);
  });

  it("policy requires green CI for merge", () => {
    const policy = readFileSync(policyPath, "utf-8");
    expect(/CI.*green|checks.*green|status.*check/i.test(policy)).toBe(true);
  });

  it("AI_FORBIDDEN_ACTIONS.md mentions autonomous merge prohibition", () => {
    const forbidden = readFileSync(forbiddenPath, "utf-8");
    expect(/autonomous.*merge|merge.*without.*owner/i.test(forbidden)).toBe(true);
  });

  it("AI_FORBIDDEN_ACTIONS.md mentions --admin prohibition", () => {
    const forbidden = readFileSync(forbiddenPath, "utf-8");
    expect(/--admin/.test(forbidden)).toBe(true);
  });

  it(".claude/settings.local.json does not allow git push --force", () => {
    if (!existsSync(settingsPath)) return;
    const allow = JSON.parse(readFileSync(settingsPath, "utf-8"))?.permissions?.allow ?? [];
    for (const entry of allow) {
      const cmd = entry.replace(/^Bash\(/, "").replace(/\)$/, "");
      expect(/git\s+push\s+--force/.test(cmd)).toBe(false);
    }
  });

  it(".claude/settings.local.json does not allow direct push to main", () => {
    if (!existsSync(settingsPath)) return;
    const allow = JSON.parse(readFileSync(settingsPath, "utf-8"))?.permissions?.allow ?? [];
    for (const entry of allow) {
      const cmd = entry.replace(/^Bash\(/, "").replace(/\)$/, "");
      if (/git\s+push/.test(cmd) && !/origin\s+HEAD/.test(cmd) && !/-u\s+origin/.test(cmd)) {
        expect(/\bmain\b/.test(cmd)).toBe(false);
      }
    }
  });

  it(".claude/settings.local.json does not allow --no-verify", () => {
    if (!existsSync(settingsPath)) return;
    const allow = JSON.parse(readFileSync(settingsPath, "utf-8"))?.permissions?.allow ?? [];
    for (const entry of allow) {
      expect(/--no-verify/.test(entry)).toBe(false);
    }
  });

  it(".claude/settings.local.json does not allow gh pr merge --admin", () => {
    if (!existsSync(settingsPath)) return;
    const allow = JSON.parse(readFileSync(settingsPath, "utf-8"))?.permissions?.allow ?? [];
    for (const entry of allow) {
      expect(/gh\s+pr\s+merge\s+--admin/.test(entry)).toBe(false);
    }
  });

  it(".claude/settings.local.json does not have broad gh pr wildcard", () => {
    if (!existsSync(settingsPath)) return;
    const allow = JSON.parse(readFileSync(settingsPath, "utf-8"))?.permissions?.allow ?? [];
    for (const entry of allow) {
      const cmd = entry.replace(/^Bash\(/, "").replace(/\)$/, "");
      const isWildGhPr = /^gh\s+pr\s+\*$/.test(cmd.trim());
      expect(isWildGhPr).toBe(false);
    }
  });
});
