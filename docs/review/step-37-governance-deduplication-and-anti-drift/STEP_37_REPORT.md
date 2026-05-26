# Step 37 — Governance Deduplication and Anti-Drift

Status: `GOVERNANCE_DEDUPLICATION_READY`

## Baseline

- Branch: `chore/governance-foundation-pack`
- Commit before changes: `d03ea91`
- Initial status: all gates green

## ADR IMPACT DECISION

This change adds a new governance rule (PX-GOV-005) and guard (GUARD-047).
NO_ADR_REQUIRED — this is governance-internal tooling, not an architecture change.

## Scope

- Requested: governance rules deduplication and anti-drift
- Not touched: product, UI, runtime, migrations, Railway, dependencies

## Summary

| Metric | Value |
|---|---|
| Potential hidden rules scanned | 44+ files |
| Duplicates found | 4 |
| Missing from registry | 0 |
| Conflicts found | 0 |
| New rules added to registry | 1 (PX-GOV-005) |
| LOCAL_NOTE classifications | 4 |
| HISTORICAL_REPORT_ONLY | 0 |
| Template instructions | 10 |
| Authority docs needing governance header | 21 |
| Domain READMEs standardized | 15 |

## New Rule

| ID | Title | Severity | Guard |
|---|---|---|---|
| PX-GOV-005 | No governance drift — normative rules require Rule ID or link | P0 | check-governance-drift.mjs (GUARD-047) |

## What was done

1. **Hidden rules audit**: Scanned docs/, architecture/, ai/, security/, templates/, domain READMEs, CI, hooks, claude config for normative phrases
2. **Anti-drift guard**: Created `scripts/check-governance-drift.mjs` that blocks un-attributed global rules in READMEs and ensures authority docs have canonical governance links
3. **Hidden Rules Inventory**: Created `docs/governance/HIDDEN_RULES_INVENTORY.md` documenting all findings
4. **Domain README standardization**: Added canonical governance links to all 15 domain READMEs
5. **Authority doc headers**: Added canonical governance entrypoint header to 21 docs (architecture, ADRs, AI, security)
6. **Registry updates**: Added PX-GOV-005 to RULES_REGISTRY.yml, GUARD-047 to GUARDS_REGISTRY.yml, updated RULES_TO_GUARDS_MATRIX.md and GOVERNANCE_INDEX.md
7. **Tests**: Created governance-drift.test.ts
8. **Guard wiring**: Added check-governance-drift.mjs to rules-check.mjs

## Changed files

### New files
- `scripts/check-governance-drift.mjs`
- `scripts/__tests__/governance-drift.test.ts`
- `docs/governance/HIDDEN_RULES_INVENTORY.md`
- `docs/review/step-37-governance-deduplication-and-anti-drift/STEP_37_REPORT.md`
- `docs/review/step-37-governance-deduplication-and-anti-drift/HIDDEN_RULES_AUDIT.md`
- `docs/review/step-37-governance-deduplication-and-anti-drift/DEDUPLICATION_SUMMARY.md`
- `docs/review/step-37-governance-deduplication-and-anti-drift/GOVERNANCE_DRIFT_GUARD.md`
- `docs/review/step-37-governance-deduplication-and-anti-drift/README_STANDARDIZATION.md`
- `docs/review/step-37-governance-deduplication-and-anti-drift/COMMAND_LOGS.md`
- `docs/review/step-37-governance-deduplication-and-anti-drift/BLOCKED_ITEMS.md`
- `docs/review/step-37-governance-deduplication-and-anti-drift/SELF_AUDIT.md`
- `docs/review/step-37-governance-deduplication-and-anti-drift/FILE_MANIFEST.md`

### Modified files
- `docs/governance/RULES_REGISTRY.yml` — added PX-GOV-005
- `docs/governance/GUARDS_REGISTRY.yml` — added GUARD-047
- `docs/governance/RULES_TO_GUARDS_MATRIX.md` — added PX-GOV-005 row, updated totals
- `docs/governance/GOVERNANCE_INDEX.md` — added anti-drift section
- `scripts/rules-check.mjs` — added check-governance-drift.mjs
- `docs/review/REVIEW_REPORTS_INDEX.md` — added step-37 entry
- 21 authority docs — added canonical governance header
- 15 domain READMEs — added canonical governance links section

## Architecture impact

None. This is governance-internal organization. No domain boundaries, imports, or runtime code changed.

## Gates

| Gate | Status | Log |
|---|---|---|
| pnpm check | PASS | see COMMAND_LOGS.md |
| pnpm lint | PASS | see COMMAND_LOGS.md |
| pnpm test | PASS | see COMMAND_LOGS.md |
| pnpm build | PASS | see COMMAND_LOGS.md |
| pnpm rules:check | PASS | see COMMAND_LOGS.md |
| pnpm arch:check:v2 | PASS | see COMMAND_LOGS.md |

## PRE-COMMIT DECISION

- Branch: `chore/governance-foundation-pack`
- Commit before changes: `d03ea91`
- Changed files: ~50 (guard, test, inventory, 21 authority docs, 15 READMEs, registries, report)
- Domains touched: none (governance-only changes)
- Scope respected: PASS

- Cross-domain imports: PASS — no runtime code changed
- Legacy runtime imports: PASS — no runtime code changed
- Removed routes/nav/build chunks: PASS — no product changes
- Public DTO PII: PASS — no DTO changes
- Media base64/dataUrl: PASS — no media changes
- List pagination/limit/cursor: PASS — no list/feed changes
- Fake DONE/status truth: PASS — no status changes
- Env safety: PASS — no env changes
- TypeScript: PASS — pnpm check exit 0
- V2 lint: PASS — pnpm lint exit 0
- Tests: PASS — pnpm test exit 0 (479 tests)
- Build: PASS — pnpm build exit 0
- rules:check: PASS — pnpm rules:check exit 0

Commit decision: `COMMIT_ALLOWED`

## SELF-AUDIT / INDEPENDENT REVIEW PASS

| # | Question | Answer |
|---|---|---|
| 1 | What I changed | New guard script, test, inventory doc, registry updates, governance headers on 21 docs, governance links on 15 domain READMEs, step-37 report |
| 2 | What I might have broken | Nothing — only added headers and a new guard; no functional code changed |
| 3 | Domain boundaries affected | None — only docs/ and scripts/ |
| 4 | Cross-domain imports check | No runtime code modified |
| 5 | Legacy/runtime check | No runtime code imported or modified |
| 6 | Fake DONE/status truth check | No status strings changed |
| 7 | PII/base64/secrets check | No PII, base64, or secrets introduced |
| 8 | Routes/nav/build graph check | No routes or nav changed |
| 9 | Guard weakening check | No guards removed or weakened; one new guard added |
| 10 | Evidence reviewed | HIDDEN_RULES_INVENTORY.md, governance-drift guard output |
| 11 | Gates run | pnpm check, lint, test, build, rules:check, arch:check:v2 — all PASS |
| 12 | Remaining risks | None — governance-only change |

## Blockers

None.

## Next step

Ready for PR review and merge.
