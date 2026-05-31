# Slice 25 — Rule writing quality final pass

## 1. Scope

Re-reads every authoritative governance / architecture / AI policy
document AT HEAD AFTER Slice 24 (commit `c18184c`) plus the Slice 25
deltas, and flags wording issues that could mislead a future agent.

Documents reviewed:

- `docs/governance/RULES_REGISTRY.yml`
- `docs/governance/GUARDS_REGISTRY.yml`
- `docs/governance/RULES_TO_GUARDS_MATRIX.md`
- `docs/governance/STATUS_TAXONOMY.md`
- `docs/governance/AGENT_COMMAND_STANDARD.md`
- `docs/governance/AI_AGENT_PERMISSIONS_POLICY.md`
- `docs/governance/EXCEPTIONS_REGISTER.md`
- `docs/architecture/PlatformaX-V2-coding-standards.md`
- `docs/architecture/BRAMKA.md`
- `docs/governance/BACKEND_ARCHITECTURE_INVARIANTS.md`
- `docs/architecture/PlatformaX-V2-active-rules.md`

## 2. Findings & actions

| # | Finding | Action taken in Slice 25 |
|---|---|---|
| 1 | The four Slice 25 P1 rules previously carried `notes: "check-X.mjs TODO"` placeholders in `RULES_REGISTRY.yml`. After landing the guards, those notes describe shipped state, not TODO. | UPDATED — `notes` rewritten with shipped status + ACK file count + remaining manual scope. |
| 2 | `RULES_TO_GUARDS_MATRIX.md` `Gap?` column carried `TODO_GUARD: …` annotations. Slice 25 shipped narrow guards, so the annotations would lie if left as-is. | UPDATED — rows for PX-ID-001, PX-ERROR-001, PX-UI-002, PX-OBS-003, PX-CTX-001 flipped `YES → PARTIAL`; row for PX-SEED-001 flipped `PARTIAL → NO`. Two new rows added for PX-STORAGE-001 and PX-HUB-001 with `NO`. |
| 3 | The summary block at the bottom of `RULES_TO_GUARDS_MATRIX.md` carried Slice-24-frozen counts. Slice 25 rewrote them and the `check-rules-to-guards-coverage.mjs` guard confirms they match the actual table. | UPDATED — 76 total rules, 62 NO, 7 YES, 7 PARTIAL, 0 TODO_GUARD markers in the matrix's last column. |
| 4 | `EXCEPTIONS_REGISTER.md` had no formal `EXC-016` entry even though Slice 24 ACK markers in 38+ service files referenced it. | ADDED — `EXC-016` registered as the pre-runtime ACK umbrella. Files column intentionally left empty because the per-rule `PX-<RULE>-ACK:` convention is tracked by each guard, not by the `PLATFORMAX_EXCEPTION` token that `check-inline-exceptions-registered.mjs` validates. |
| 5 | Aliasing pairs (`PX-INFRA-002` / `PX-DB-001`, `PX-LC-001` / `PX-LIFECYCLE-001`, `PX-IDEMP-001` / `PX-IDEMPOTENCY-001`) were already documented in `SLICE_24_RULES_COHERENCE_AUDIT.md §2`. No new aliases introduced in Slice 25. | NO ACTION — historical aliases stay; no rewrite of past reports. |
| 6 | Weak modal verbs ("should consider", "might prefer") were already addressed in 7 documents during Slice 24 (per `SLICE_24_RULES_COHERENCE_AUDIT.md §3`). Spot-check at HEAD confirms none re-introduced in Slice 25. | NO ACTION — spot-check PASS. |
| 7 | Inconsistent acceptance terminology: `READY` / `DONE` / `IMPLEMENTED` / `PASS` / `TOP_TIER_READY`. `STATUS_TAXONOMY.md` already defines each. Slice 25 reports use only the defined terms (no marketing language, no "production-ready"). | NO ACTION — vocabulary already pinned. |
| 8 | `GUARDS_REGISTRY.yml` did not previously carry a `coverage:` field. Slice 25 P1 guards introduced `coverage: NARROW` to signal that the guard fails closed on new code AND respects ACK markers on existing pre-runtime code. | NEW FIELD INTRODUCED — applies only to GUARD-063..072. Existing P0 guards already carry `parallel_status` where applicable; the two fields complement each other. |
| 9 | Helper-vs-acceptance distinction (verify:fast / verify:normal vs verify:deep) was already pinned by `STATUS_TAXONOMY.md §Deep-only acceptance` (Slice 24). Re-read confirms the banner text matches `package.json`. | NO ACTION. |
| 10 | `coding-standards §31` distinguishes "report ZIP" (audit-only) from "full source ZIP" (clean HEAD). The Slice 24 `_DIRTY` ZIP demonstrated the cost of conflating the two. Slice 25's clean HEAD ZIP demonstrates the correct path. | NO TEXT CHANGE — Slice 25's ZIP itself is the evidence. |
| 11 | `BACKEND_ARCHITECTURE_INVARIANTS.md` already covers all six new P1 rule areas (ownership, idempotency, viewer context, visibility, event envelope, read-model owner). Slice 25 did NOT rewrite invariants — only added guards that enforce them. | NO ACTION — invariants are the source of truth. |
| 12 | `AGENT_COMMAND_STANDARD.md §15` forbids rewriting historical reports. Slice 25 added new reports under `slice-25/` instead of editing Slice 24 reports. | COMPLIANCE — Slice 24 reports unmodified. |

## 3. Residual ambiguities (intentionally deferred)

Two ambiguities were noted in `SLICE_24_RULES_COHERENCE_AUDIT.md §5`
and remain deferred in Slice 25 because addressing them safely requires
a runtime context (e.g. real RequestContext type):

- **PX-OBS-003 semantic scope** — the new narrow guard checks for the
  literal `correlationId` token. Whether a `RequestContext` typed
  object is the correct carrier vs. an explicit parameter stays
  open. Pinned for Slice 27+ runtime-prep.
- **PX-CTX-001 enforcement granularity** — narrow guard checks for
  `contextType` token only. The full triple `contextType /
  contextOwnerId / contextRefId` stays a manual review item until
  the content runtime ships.

Both are noted in the rules' `notes` field and the matrix's
"Required Improvement" column.

## 4. Coherence check

Ran `pnpm rules:check` (65 / 65), `pnpm arch:check:v2` (17 / 17),
`pnpm guards:all-local` (clean), and `node scripts/check-rules-to-guards-coverage.mjs`
(`CHECK_RULES_TO_GUARDS_COVERAGE_PASS (49 P0 active rules checked,
76 matrix rows verified)`). Wording matches enforcement.

Status of this file: **COHERENCE_VERIFIED — NO REWRITES OF HISTORY**.
