// PX-GOV-003 / PX-GOV-004 / PX-INFRA-001 / PX-INFRA-002
// Hardens the .claude/settings*.json allow-list so AI agents cannot grant
// themselves broad, dangerous, or main-bypassing permissions.
//
// Checks both:
//   .claude/settings.example.json  (tracked audit reference)
//   .claude/settings.local.json    (local, may not exist)

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const EXAMPLE_PATH = join(ROOT, ".claude/settings.example.json");
const LOCAL_PATH = join(ROOT, ".claude/settings.local.json");

// Entries explicitly allowed even though they look like broad git pushes —
// they only enable pushing the CURRENT branch (`HEAD`) to its remote, never
// `main`, never `--force`, never `--no-verify`.
const PUSH_ALLOWLIST = new Set([
  "git push origin HEAD",
  "git push -u origin HEAD",
  "git push origin head",
  "git push -u origin head",
]);

// Broad bash entries that are dangerous unless narrowly scoped.
// Each rule returns { ok, reason } when given a normalized command string.
const BROAD_BANS = [
  {
    label: "broad git push wildcard",
    test: (n) => {
      if (!/^git\s+push\b/.test(n)) return false;
      if (PUSH_ALLOWLIST.has(n)) return false;
      // `git push origin HEAD*` would match `HEAD` but also widen — treat any
      // wildcard / catch-all on push as broad.
      if (/git\s+push\s+(--?\S+\s+)?(\*|origin\s+\*|-u\s+origin\s+\*)$/.test(n)) return true;
      if (/git\s+push\s+\*$/.test(n)) return true;
      if (/git\s+push\s+origin\s+\*$/.test(n)) return true;
      if (/git\s+push\s+-u\s+origin\s+\*$/.test(n)) return true;
      if (/git\s+push\s+origin\s+HEAD\*/.test(n)) return true;
      // `git push *` style: bare wildcard immediately after push.
      if (/git\s+push\s+[A-Za-z0-9_-]+\s+\*$/.test(n)) return true;
      return false;
    },
  },
  {
    label: "git push to main",
    test: (n) => /^git\s+push\s+(.+\s+)?(origin\s+)?main(\s|$)/.test(n),
  },
  {
    label: "git push --force",
    test: (n) => /git\s+push\s+--force\b/.test(n) || /git\s+push\s+-f\b/.test(n),
  },
  {
    label: "--no-verify",
    test: (n) => /--no-verify\b/.test(n),
  },
  {
    label: "git reset --hard",
    test: (n) => /git\s+reset\s+--hard\b/.test(n),
  },
  {
    label: "git clean wildcard",
    test: (n) => /^git\s+clean(\s+|$)/.test(n) && /\*/.test(n),
  },
  {
    label: "git checkout -- *",
    test: (n) => /git\s+checkout\s+--\s+\*/.test(n) || /^git\s+checkout\s+\*$/.test(n),
  },
  {
    label: "broad git checkout wildcard",
    // narrow `git checkout -b *` is also broad enough to switch any branch incl. main
    test: (n) => /^git\s+checkout\s+\*$/.test(n),
  },
  {
    label: "broad git pull without --ff-only",
    test: (n) => {
      if (!/^git\s+pull\b/.test(n)) return false;
      if (/--ff-only\b/.test(n)) return false;
      // `git pull *` or `git pull origin *` without ff-only = broad
      return /\*/.test(n) || /^git\s+pull\s*$/.test(n);
    },
  },
  {
    label: "broad git stash wildcard",
    test: (n) => /^git\s+stash\s+\*$/.test(n),
  },
  {
    label: "broad gh api wildcard (mutable bypass)",
    test: (n) => /^gh\s+api(\s+|$)/.test(n) && /\*/.test(n),
  },
  {
    label: "gh pr merge",
    test: (n) => /^gh\s+pr\s+merge\b/.test(n),
  },
  {
    label: "broad node arbitrary execution",
    test: (n) => {
      if (!/^node\b/.test(n)) return false;
      // narrow: node scripts/...  or  node ./scripts/...
      if (/^node\s+(\.\/)?scripts\//.test(n)) return false;
      // broad: `node *`, `node script.js`, etc.
      return true;
    },
  },
  {
    label: "npm * broad arbitrary execution",
    test: (n) => /^npm\s+\*$/.test(n) || /^npm\s+run\s+\*$/.test(n),
  },
  {
    label: "railway",
    test: (n) => /\brailway\b/.test(n),
  },
  {
    label: "supabase db push",
    test: (n) => /supabase\s+db\s+push\b/.test(n),
  },
  {
    label: "rm -rf wildcard",
    test: (n) => /\brm\s+-rf\b/.test(n),
  },
  {
    label: "broad grep wildcard",
    test: (n) => /^grep\s+\*$/.test(n),
  },
  {
    label: "git merge main",
    test: (n) => /git\s+merge\s+(origin\/)?main\b/.test(n),
  },
];

function normalize(entry) {
  // strip Bash(...) wrapper; trim
  let s = String(entry).trim();
  if (s.startsWith("Bash(") && s.endsWith(")")) {
    s = s.slice(5, -1);
  }
  return s.trim();
}

function checkAllowList(label, allow) {
  const violations = [];
  if (!Array.isArray(allow)) {
    violations.push(`${label}: permissions.allow is not an array`);
    return violations;
  }
  for (const raw of allow) {
    const norm = normalize(raw);
    for (const ban of BROAD_BANS) {
      if (ban.test(norm)) {
        violations.push(`${label}: forbidden permission "${ban.label}" in entry: ${raw}`);
      }
    }
  }
  return violations;
}

function loadJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch (e) {
    return { __parseError: e.message };
  }
}

const allViolations = [];
let checked = 0;

for (const [label, path] of [["settings.example.json", EXAMPLE_PATH], ["settings.local.json", LOCAL_PATH]]) {
  const json = loadJson(path);
  if (!json) continue;
  checked++;
  if (json.__parseError) {
    allViolations.push(`AI_AGENT_PERMISSIONS_VIOLATION: failed to parse ${label}: ${json.__parseError}`);
    continue;
  }
  const allow = json?.permissions?.allow ?? [];
  allViolations.push(...checkAllowList(label, allow));
}

if (checked === 0) {
  console.log("CHECK_AI_AGENT_PERMISSIONS_PASS (no .claude/settings*.json files found — nothing to check)");
  process.exit(0);
}

if (allViolations.length > 0) {
  for (const v of allViolations) console.error(`AI_AGENT_PERMISSIONS_VIOLATION: ${v}`);
  console.error(`\ncheck-ai-agent-permissions: ${allViolations.length} violation(s) across ${checked} file(s)`);
  process.exit(1);
}

console.log(`CHECK_AI_AGENT_PERMISSIONS_PASS (${checked} file(s) checked)`);

export { normalize, checkAllowList, BROAD_BANS, PUSH_ALLOWLIST };
