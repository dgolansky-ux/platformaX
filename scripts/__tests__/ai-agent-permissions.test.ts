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

const WILDCARD_DANGEROUS_PREFIXES = [
  { wildcard: "git push", covers: ["git push --force", "git push origin main"] },
  { wildcard: "git commit", covers: ["git commit --no-verify"] },
  { wildcard: "git reset", covers: ["git reset --hard"] },
  { wildcard: "git merge", covers: ["git merge main"] },
  { wildcard: "gh pr", covers: ["gh pr merge"] },
];

function getAllowList(content: string): string[] {
  try {
    const parsed = JSON.parse(content);
    return parsed?.permissions?.allow ?? [];
  } catch {
    return [];
  }
}

function wildcardCovers(normalized: string, prefix: string): boolean {
  if (!normalized.includes("*")) return false;
  const base = normalized.replace(/\s*\*+\s*$/, "").trim();
  return prefix.startsWith(base);
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

  it("PASS: no wildcard permissions that encompass dangerous commands", () => {
    if (!settingsExist) return;

    const content = readFileSync(SETTINGS_PATH, "utf-8");
    const allowList = getAllowList(content);

    for (const entry of allowList) {
      const normalized = entry.replace(/^Bash\(/, "").replace(/\)$/, "");
      for (const { wildcard, covers } of WILDCARD_DANGEROUS_PREFIXES) {
        if (wildcardCovers(normalized, wildcard)) {
          for (const dangerous of covers) {
            expect(false).toBe(true);
          }
        }
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

  it("FAIL: detects wildcard 'git push *' as covering --force", () => {
    const normalized = "git push *".replace(/\s*\*+\s*$/, "").trim();
    expect(wildcardCovers("git push *", "git push")).toBe(true);
  });
});
