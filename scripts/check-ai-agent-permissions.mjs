import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SETTINGS_PATH = join(ROOT, ".claude/settings.local.json");

const CONTROLLED_MERGE_RE = /^gh\s+pr\s+merge\s+--merge\s+--delete-branch\b/;

const DANGEROUS_PATTERNS = [
  { pattern: /git\s+push\s+(.*\s+)?main/, prefix: "git push", label: "git push to main" },
  { pattern: /git\s+push\s+--force/, prefix: "git push", label: "git push --force" },
  { pattern: /git\s+commit\s+--no-verify/, prefix: "git commit", label: "git commit --no-verify" },
  { pattern: /git\s+reset\s+--hard/, prefix: "git reset", label: "git reset --hard" },
  { pattern: /git\s+merge\s+main/, prefix: "git merge", label: "git merge main" },
  { pattern: /gh\s+pr\s+merge\s+--admin/, prefix: "gh pr merge", label: "gh pr merge --admin" },
  { pattern: /rm\s+-rf/, prefix: "rm -rf", label: "rm -rf" },
  { pattern: /supabase\s+db\s+push/, prefix: "supabase db push", label: "supabase db push" },
  { pattern: /\brailway\b/, prefix: "railway", label: "railway" },
];

const HARD_FAIL_PATTERNS = [
  { pattern: /git\s+push\s+--force/, prefix: "git push", label: "git push --force" },
  { pattern: /--no-verify/, prefix: "", label: "--no-verify" },
];

let warnings = 0;
let violations = 0;

if (!existsSync(SETTINGS_PATH)) {
  console.log("CHECK_AI_AGENT_PERMISSIONS_PASS (no .claude/settings.local.json found — nothing to check)");
  process.exit(0);
}

let settings;
try {
  const raw = readFileSync(SETTINGS_PATH, "utf-8");
  settings = JSON.parse(raw);
} catch (e) {
  console.error(`AI_AGENT_PERMISSIONS_VIOLATION: failed to parse .claude/settings.local.json: ${e.message}`);
  process.exit(1);
}

const allowList = settings?.permissions?.allow || [];

if (!Array.isArray(allowList)) {
  console.error("AI_AGENT_PERMISSIONS_VIOLATION: permissions.allow is not an array");
  process.exit(1);
}

function wildcardCovers(normalized, prefix) {
  if (!normalized.includes("*")) return false;
  const base = normalized.replace(/\s*\*+\s*$/, "").trim();
  return prefix.startsWith(base);
}

for (const entry of allowList) {
  const normalized = entry.replace(/^Bash\(/, "").replace(/\)$/, "");

  if (CONTROLLED_MERGE_RE.test(normalized) && !/--admin/.test(normalized)) {
    continue;
  }

  for (const { pattern, label } of HARD_FAIL_PATTERNS) {
    if (pattern.test(normalized)) {
      console.error(`AI_AGENT_PERMISSIONS_VIOLATION: unconditional dangerous permission found: "${label}" in entry: ${entry}`);
      violations++;
    }
  }

  for (const { pattern, prefix, label } of DANGEROUS_PATTERNS) {
    if (pattern.test(normalized)) {
      console.error(`AI_AGENT_PERMISSIONS_VIOLATION: explicitly dangerous permission "${label}" in entry: ${entry}`);
      violations++;
    } else if (wildcardCovers(normalized, prefix)) {
      console.error(`AI_AGENT_PERMISSIONS_VIOLATION: wildcard permission encompasses "${label}" in entry: ${entry}`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-ai-agent-permissions: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_AI_AGENT_PERMISSIONS_PASS");
