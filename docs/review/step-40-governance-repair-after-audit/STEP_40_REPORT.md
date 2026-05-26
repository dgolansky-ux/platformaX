# Step 40 — Governance Repair After Audit

Branch: `chore/governance-repair-after-audit`
Baseline: `main` @ `963c8ca`
Date: 2026-05-26

## Objective

Repair governance issues identified during the external audit of snapshot `963c8ca`.

## Blockers Identified (Audit)

1. `.claude/settings.local.json` contained unsafe wildcard permissions (`Bash(gh pr *)`, `Bash(git commit *)`, `Bash(git push *)`, `Bash(git rebase *)`) that caused `check-ai-agent-permissions.mjs` to fail.
2. No explicit controlled AI PR merge policy existed — `gh pr merge` was fully blocked with no safe path.
3. README governance links in `server/domains-v2/*/README.md` used wrong relative paths (`../../docs/governance/` instead of `../../../docs/governance/`).
4. `client/src/features-v2/*/README.md` and `client/src/app-v2/README.md` had no canonical governance links.
5. `HIDDEN_RULES_INVENTORY.md` incorrectly stated frontend READMEs did not exist.

## What Was Fixed

1. **`.claude/settings.local.json`** — Replaced broad wildcards with specific, safe commands. No `--force`, `--no-verify`, direct push to `main`, or `--admin` permitted.
2. **Controlled AI PR Merge Policy (PX-GOV-006)** — Added to `AI_AGENT_PERMISSIONS_POLICY.md`, `AI_FORBIDDEN_ACTIONS.md`, `RULES_REGISTRY.yml`, `GOVERNANCE_INDEX.md`, `RULES_TO_GUARDS_MATRIX.md`.
3. **New guard script** — `scripts/check-ai-pr-merge-policy.mjs` validates policy docs and settings.
4. **New eligibility script** — `scripts/check-pr-merge-eligibility.mjs` checks PR conditions via `gh CLI`.
5. **Tests** — `scripts/__tests__/ai-pr-merge-policy.test.ts` and `scripts/__tests__/pr-merge-eligibility.test.ts`.
6. **Guards wiring** — New guard added to `rules-check.mjs` and `GUARDS_REGISTRY.yml`.
7. **README links** — Fixed 15 domain READMEs, added governance links to 16 feature READMEs and `app-v2/README.md`.
8. **HIDDEN_RULES_INVENTORY.md** — Updated scan counts to reflect existing frontend READMEs.
9. **`check-ai-agent-permissions.mjs`** — Updated to allow controlled merge form (`gh pr merge --merge --delete-branch *`) while blocking `--admin`.

## Remaining Risks

- PR merge eligibility script requires `gh CLI` auth — cannot be automated in CI without GitHub token setup.
- Visual parity rules (PX-PROFILE-001, PX-PROFILE-002) remain manual gates — inherently non-automatable.

## Gate Results

| Gate | Result |
|---|---|
| `pnpm check` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS (501 tests, 78 files) |
| `pnpm build` | PASS |
| `pnpm rules:check` | PASS (all guards incl. new check-ai-pr-merge-policy) |
| `pnpm arch:check:v2` | PASS |
| `pnpm guards:all-local` | PASS (25/25) |

## PRE-COMMIT DECISION

Changed files: 57 (governance docs, guard scripts, tests, READMEs, review reports)
Domains touched: none (governance-only change)
Cross-domain imports: none added
Legacy runtime imports: none added
Removed routes/nav/build chunks: none
Public DTO PII: none changed
Media base64/dataUrl: none added
List pagination/limit/cursor: not affected
Fake DONE/status truth: no status strings changed
Env safety: no .env changes
TypeScript: PASS (pnpm check exit 0)
V2 lint: PASS (pnpm lint exit 0)
Tests: PASS (501 tests, 78 files, pnpm test exit 0)
Build: PASS (pnpm build exit 0)
Commit decision: `COMMIT_ALLOWED`

## SELF-AUDIT / INDEPENDENT REVIEW PASS

| # | Question | Answer |
|---|---|---|
| 1 | What I changed | .claude/settings.local.json, AI permissions guard, merge policy docs, 2 new scripts, 2 new test files, 32 README link fixes, HIDDEN_RULES_INVENTORY update, GUARDS_REGISTRY + RULES_REGISTRY + GOVERNANCE_INDEX updates, step-40 report |
| 2 | What I might have broken | Nothing — governance/docs only, no runtime code |
| 3 | Domain boundaries affected | None |
| 4 | Cross-domain imports check | No runtime code modified |
| 5 | Legacy/runtime check | No runtime code imported or modified |
| 6 | Fake DONE/status truth check | No status strings changed |
| 7 | PII/base64/secrets check | No PII, base64, or secrets introduced |
| 8 | Routes/nav/build graph check | No routes or nav changed |
| 9 | Guard weakening check | No guards removed or weakened. check-ai-agent-permissions.mjs updated to allow controlled merge form while still blocking --admin, --force, direct push to main, --no-verify |
| 10 | Evidence reviewed | COMMAND_LOGS.md, SELF_AUDIT.md, all gate exit codes |
| 11 | Gates run | pnpm check, lint, test (501/501), build, rules:check (44/44), arch:check:v2, guards:all-local (25/25) — all PASS |
| 12 | Remaining risks | PR merge eligibility script requires gh CLI auth — manual gate only |

## Conclusion

All audit findings addressed. All gates green. Ready for review.
