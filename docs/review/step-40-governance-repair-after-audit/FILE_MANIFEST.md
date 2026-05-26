# File Manifest — Step 40

## New files

| File | Purpose |
|---|---|
| `scripts/check-ai-pr-merge-policy.mjs` | Guard: validates AI merge policy docs and settings |
| `scripts/check-pr-merge-eligibility.mjs` | Eligibility checker: validates PR conditions via gh CLI |
| `scripts/__tests__/ai-pr-merge-policy.test.ts` | Tests for merge policy guard |
| `scripts/__tests__/pr-merge-eligibility.test.ts` | Tests for eligibility script |
| `docs/review/step-40-governance-repair-after-audit/*` | Step 40 report files |

## Modified files

| File | Change |
|---|---|
| `.claude/settings.local.json` | Replaced wildcards with safe specific commands |
| `scripts/check-ai-agent-permissions.mjs` | Allow controlled merge form, block --admin |
| `scripts/rules-check.mjs` | Added check-ai-pr-merge-policy.mjs to guard list |
| `docs/governance/AI_AGENT_PERMISSIONS_POLICY.md` | Added PX-GOV-006 controlled merge section |
| `docs/governance/GOVERNANCE_INDEX.md` | Added AI PR Merge Policy section |
| `docs/governance/RULES_REGISTRY.yml` | Added PX-GOV-006 rule entry |
| `docs/governance/GUARDS_REGISTRY.yml` | Added GUARD-048, GUARD-049 |
| `docs/governance/RULES_TO_GUARDS_MATRIX.md` | Added PX-GOV-006 row, updated count |
| `docs/governance/HIDDEN_RULES_INVENTORY.md` | Fixed frontend README scan counts |
| `docs/ai/AI_FORBIDDEN_ACTIONS.md` | Added autonomous merge + --admin entries |
| `client/src/app-v2/README.md` | Added governance links section |
| `client/src/features-v2/*/README.md` (16 files) | Added governance links section |
| `server/domains-v2/*/README.md` (15 files) | Fixed governance link paths |
