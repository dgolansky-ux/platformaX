# Step 35 — Governance Red-Team Audit

Status: `GOVERNANCE_RED_TEAM_READY`
Date: 2026-05-26
Branch: `chore/governance-foundation-pack`
Base commit: `b0c1e81`

## Scope

Independent red-team audit of governance foundation pack (step-34).
No feature work. No product changes. Governance, guards, status truth, permissions only.

## Changes Made

### 1. `.claude/settings.local.json` hardened

- Removed dangerous wildcard entries: `Bash(git push *)`, `Bash(git commit *)`, `Bash(git reset *)`, `Bash(git merge *)`, `Bash(gh pr *)`, `Bash(pnpm add *)`
- Replaced with specific safe variants: `Bash(git commit -m *)`, `Bash(git push -u origin HEAD)`, `Bash(git push origin HEAD)`, `Bash(gh pr create *)`, etc.
- Added explicit `deny` list for: `git push --force`, `git push -f`, `git push origin main`, `git commit --no-verify`, `git reset --hard`, `gh pr merge`, `rm -rf`, `supabase db push`, `railway`

### 2. Domain status conflicts resolved (13 → 0)

All 13 conflicts between `domain-registry.ts`, `domain-status.md`, and `DOMAIN_STATUS_REGISTRY.yml` resolved with file-level evidence:

| Domain | Previous conflict | Resolution | Evidence |
|---|---|---|---|
| identity | domain-registry.ts=SCAFFOLD_ONLY, domain-status.md=PARTIAL | PARTIAL | service.ts, repository.ts, mapper.ts, 5 test files |
| social | domain-registry.ts=SCAFFOLD_ONLY, domain-status.md=PLANNED | SCAFFOLD_ONLY | 7 scaffold files, no service/repository |
| content-v2 | domain-registry.ts=SCAFFOLD_ONLY, domain-status.md=PLANNED | SCAFFOLD_ONLY | extensive subdomain scaffold, no service/repository |
| communities-v2 | domain-registry.ts=SCAFFOLD_ONLY, domain-status.md=PLANNED | SCAFFOLD_ONLY | 8 scaffold files, no service/repository |
| channels | domain-registry.ts=SCAFFOLD_ONLY, domain-status.md=PLANNED | SCAFFOLD_ONLY | 8 scaffold files, no service/repository |
| chat | domain-registry.ts=SCAFFOLD_ONLY, domain-status.md=PLANNED | SCAFFOLD_ONLY | 8 scaffold files, no service/repository |
| events | domain-registry.ts=SCAFFOLD_ONLY, domain-status.md=PLANNED | SCAFFOLD_ONLY | 8 scaffold files, no service/repository |
| modules | domain-registry.ts=SCAFFOLD_ONLY, domain-status.md=PLANNED | SCAFFOLD_ONLY | 8 scaffold files, no service/repository |
| public-hub | domain-registry.ts=SCAFFOLD_ONLY, domain-status.md=PLANNED | SCAFFOLD_ONLY | 8 scaffold files, no service/repository |
| notifications | domain-registry.ts=SCAFFOLD_ONLY, domain-status.md=PLANNED | SCAFFOLD_ONLY | 8 scaffold files, no service/repository |
| search | domain-registry.ts=SCAFFOLD_ONLY, domain-status.md=PLANNED | SCAFFOLD_ONLY | 8 scaffold files, no service/repository |
| moderation | domain-registry.ts=SCAFFOLD_ONLY, domain-status.md=PLANNED | SCAFFOLD_ONLY | 8 scaffold files, no service/repository |
| audit | domain-registry.ts=SCAFFOLD_ONLY, domain-status.md=PLANNED | SCAFFOLD_ONLY | 8 scaffold files, no service/repository |
| system | domain-registry.ts=SCAFFOLD_ONLY, domain-status.md=PLANNED | SCAFFOLD_ONLY | 8 scaffold files, no service/repository |

### 3. Guard scripts hardened

- `check-ai-agent-permissions.mjs`: Wildcards that cover dangerous commands now FAIL (violation) instead of WARN
- `check-domain-status-registry.mjs`: Added cross-check of domain-registry.ts statuses vs DOMAIN_STATUS_REGISTRY.yml statuses — flags unflagged mismatches as violations; requires adequate resolution text (≥10 chars)

### 4. Tests updated

- `ai-agent-permissions.test.ts`: Added wildcard detection test and verification that current settings.local.json has no dangerous wildcards

## Files Modified

- `.claude/settings.local.json`
- `scripts/check-ai-agent-permissions.mjs`
- `scripts/check-domain-status-registry.mjs`
- `scripts/__tests__/ai-agent-permissions.test.ts`
- `docs/governance/DOMAIN_STATUS_REGISTRY.yml`
- `docs/architecture/PlatformaX-V2-domain-status.md`
- `server/domains-v2/domain-registry.ts`
- `docs/review/REVIEW_REPORTS_INDEX.md`

## Files Created

- `docs/review/step-35-governance-red-team/STEP_35_REPORT.md`
- `docs/review/step-35-governance-red-team/RED_TEAM_FINDINGS.md`
- `docs/review/step-35-governance-red-team/STATUS_CONFLICT_RESOLUTION.md`
- `docs/review/step-35-governance-red-team/AI_AGENT_PERMISSIONS_REVIEW.md`
- `docs/review/step-35-governance-red-team/GUARD_COVERAGE_RECHECK.md`
- `docs/review/step-35-governance-red-team/COMMAND_LOGS.md`
- `docs/review/step-35-governance-red-team/BLOCKED_ITEMS.md`
- `docs/review/step-35-governance-red-team/SELF_AUDIT.md`
- `docs/review/step-35-governance-red-team/FILE_MANIFEST.md`

## PRE-COMMIT DECISION

- Changed files: See FILE_MANIFEST.md
- Domains touched: None (governance/docs/guards only)
- Cross-domain imports: NONE
- Legacy runtime imports: NONE
- Removed routes/nav/build chunks: NONE
- Public DTO PII: NONE
- Media base64/dataUrl: NONE
- List pagination/limit/cursor: N/A (governance only, no runtime)
- Fake DONE/status truth: NONE — all statuses evidence-backed
- Env safety: No .env changes
- TypeScript: PASS
- V2 lint: PASS
- Tests: PASS (449/449)
- Build: PASS

Gates:
- Commit decision: COMMIT_ALLOWED
- Commit message: chore(governance): red-team rules registry and agent permissions
- Remaining risks: None — all conflicts resolved, guards hardened

## SELF-AUDIT / INDEPENDENT REVIEW PASS

| # | Check | Result |
|---|---|---|
| 1 | What I changed | .claude/settings.local.json hardened; guards hardened; 13 domain status conflicts resolved; all three status sources synchronized |
| 2 | What I might have broken | Guard strictness increased — any future wildcard additions will fail. domain-registry.ts identity status changed to PARTIAL |
| 3 | Domain boundaries affected | None (governance/docs only) |
| 4 | Cross-domain imports check | N/A (no runtime code changed) |
| 5 | Legacy/runtime check | N/A |
| 6 | Fake DONE/status truth check | PASS — all statuses evidence-backed |
| 7 | PII/base64/secrets check | N/A |
| 8 | Routes/nav/build graph check | N/A |
| 9 | Guard weakening check | PASS — guards strengthened, not weakened |
| 10 | Evidence reviewed | All 15 domain folders inspected for service.ts/repository.ts |
| 11 | Gates run | YES — all 6 gates |
| 12 | Remaining risks | None |
