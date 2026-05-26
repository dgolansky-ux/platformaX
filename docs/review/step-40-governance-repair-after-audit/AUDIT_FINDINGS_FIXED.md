# Audit Findings Fixed

## Finding 1: Unsafe wildcard permissions in .claude/settings.local.json

**Severity:** P0
**Status:** FIXED

The file contained `Bash(gh pr *)`, `Bash(git commit *)`, `Bash(git push *)`, `Bash(git rebase *)`. These wildcards encompassed dangerous operations like `git push --force`, `git commit --no-verify`, `gh pr merge --admin`.

**Fix:** Replaced with specific, safe commands. Each allowed command is now explicitly listed.

## Finding 2: No controlled AI merge path

**Severity:** P1
**Status:** FIXED

`gh pr merge` was fully blocked with no safe controlled path for AI-assisted merges under owner instruction.

**Fix:** Added PX-GOV-006 policy with 10 required conditions. Created `check-ai-pr-merge-policy.mjs` guard and `check-pr-merge-eligibility.mjs` runtime checker.

## Finding 3: Broken README governance links

**Severity:** P2
**Status:** FIXED

15 domain READMEs in `server/domains-v2/` used wrong relative paths (`../../docs/governance/` instead of `../../../docs/governance/`).

**Fix:** Corrected all paths to `../../../docs/governance/`.

## Finding 4: Missing frontend README governance links

**Severity:** P2
**Status:** FIXED

16 feature READMEs in `client/src/features-v2/` and `client/src/app-v2/README.md` had no canonical governance links.

**Fix:** Added governance link sections to all 17 files.

## Finding 5: HIDDEN_RULES_INVENTORY stale scan counts

**Severity:** P3
**Status:** FIXED

Inventory claimed `0 (none exist yet)` for frontend READMEs when they actually exist.

**Fix:** Updated counts to 16 (features-v2) and 1 (app-v2).
