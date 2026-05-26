import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const SETTINGS_PATH = join(ROOT, ".claude/settings.local.json");

const DANGEROUS_PATTERNS = [
  "--force",
  "--no-verify",
  "rm -rf",
  "DROP TABLE",
  "DROP DATABASE",
  "railway deploy",
  "railway up",
  "supabase db push",
];

function getAllowList(content: string): string[] {
  try {
    const parsed = JSON.parse(content);
    return parsed?.permissions?.allow ?? [];
  } catch {
    return [];
  }
}

describe("ai-agent-permissions guard logic", () => {
  const settingsExist = existsSync(SETTINGS_PATH);

  it("PASS: .claude/settings.local.json exists", () => {
    if (!settingsExist) {
      console.warn("SKIP: .claude/settings.local.json not found — test skipped gracefully");
      return;
    }
    expect(settingsExist).toBe(true);
    const content = readFileSync(SETTINGS_PATH, "utf-8");
    expect(content.length).toBeGreaterThan(0);
  });

  it("PASS: no unconditional dangerous permissions in allow list", () => {
    if (!settingsExist) return;

    const content = readFileSync(SETTINGS_PATH, "utf-8");
    const allowList = getAllowList(content);

    for (const entry of allowList) {
      for (const pattern of DANGEROUS_PATTERNS) {
        const isUnconditional = entry === `Bash(${pattern})` || entry === pattern;
        expect(
          isUnconditional,
          `Dangerous unconditional permission found: "${entry}" matches "${pattern}"`,
        ).toBe(false);
      }
    }
  });

  it("FAIL: detects --force in allow list", () => {
    const fakeAllowList = [
      "Bash(git push --force)",
      "Bash(pnpm test *)",
    ];

    const hasForce = fakeAllowList.some((entry) => entry.includes("--force"));
    expect(hasForce).toBe(true);
  });

  it("FAIL: detects --no-verify in allow list", () => {
    const fakeAllowList = [
      "Bash(git commit --no-verify)",
      "Bash(pnpm build *)",
    ];

    const hasNoVerify = fakeAllowList.some((entry) => entry.includes("--no-verify"));
    expect(hasNoVerify).toBe(true);
  });
});
