import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
let violations = 0;

function fail(msg) {
  console.error(`AI_PR_MERGE_POLICY_VIOLATION: ${msg}`);
  violations++;
}

const policyPath = join(ROOT, "docs/governance/AI_AGENT_PERMISSIONS_POLICY.md");
if (!existsSync(policyPath)) {
  fail("AI_AGENT_PERMISSIONS_POLICY.md not found");
} else {
  const policy = readFileSync(policyPath, "utf-8");

  if (!/explicit.*owner.*instruct/i.test(policy)) {
    fail("policy does not require explicit owner instruction for AI merge");
  }
  if (!/--admin/i.test(policy) || !/forbidden|block|must not/i.test(policy)) {
    fail("policy does not explicitly forbid --admin bypass");
  }
  if (!/CI.*green|checks.*green|status.*check/i.test(policy)) {
    fail("policy does not require green CI for merge");
  }
  if (!/autonomous.*merge.*forbidden|autonomous.*forbidden|forbidden.*autonomous/i.test(policy)) {
    fail("policy does not explicitly forbid autonomous AI merge");
  }
}

const forbiddenPath = join(ROOT, "docs/ai/AI_FORBIDDEN_ACTIONS.md");
if (existsSync(forbiddenPath)) {
  const forbidden = readFileSync(forbiddenPath, "utf-8");
  if (!/autonomous.*merge|merge.*without.*owner/i.test(forbidden)) {
    fail("AI_FORBIDDEN_ACTIONS.md does not mention autonomous merge prohibition");
  }
  if (!/--admin/i.test(forbidden)) {
    fail("AI_FORBIDDEN_ACTIONS.md does not mention --admin prohibition");
  }
}

const settingsPath = join(ROOT, ".claude/settings.local.json");
if (existsSync(settingsPath)) {
  let settings;
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  } catch {
    fail(".claude/settings.local.json parse error");
  }

  if (settings) {
    const allow = settings?.permissions?.allow || [];
    for (const entry of allow) {
      const cmd = entry.replace(/^Bash\(/, "").replace(/\)$/, "");
      if (/git\s+push\s+--force/.test(cmd)) {
        fail("settings allow git push --force");
      }
      if (/git\s+push\s+(.*\s+)?main\b/.test(cmd) && !/origin\s+HEAD/.test(cmd)) {
        fail("settings allow direct push to main");
      }
      if (/--no-verify/.test(cmd)) {
        fail("settings allow --no-verify");
      }
      if (/gh\s+pr\s+merge\s+--admin/.test(cmd)) {
        fail("settings allow gh pr merge --admin");
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-ai-pr-merge-policy: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_AI_PR_MERGE_POLICY_PASS");
