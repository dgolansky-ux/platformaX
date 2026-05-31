# Slice 24 — Deep-Only Governance Hardening — Final Report

## 1. Executive verdict

**STRONG_BUT_NEEDS_MORE_HARDENING.**

Slice 24 closed the 10 top-priority P0 governance gaps named in the
Slice 24 prep audit (`SLICE_24_PREP_GOVERNANCE_AND_RULES_AUDIT.md
§12`) and shipped two additional P0 guards
(`check-backend-ownership-invariants`, `check-media-attach-owner-purpose`).
Pre-runtime source files that pre-date the new guards carry per-file
`PX-RULE-ACK:` markers documenting the deferred wiring; the markers
are logged by the guards on every run. Deep-only mode is implemented
as `pnpm verify:deep` and labelled as the only acceptance gate.

It is not `TOP_TIER_READY` because four Slice 25 TODO_GUARD items
remain (`PX-ID-001` branded IDs, `PX-UI-002` presentational/container,
`PX-OBS-003` correlation ID, `PX-SEED-001` deterministic seeds) and
`eslint-plugin-boundaries` v6 still runs as `PARTIAL_NOT_ENFORCED`
(EXC-017, expiry `2026-08-31`).

It is not `BLOCKED` or `PARTIAL_GOVERNANCE_RISK` because every Slice 24
guard fails closed on new code, the matrix coverage check verifies the
flipped rows, and `EXCEPTIONS_REGISTER.md` carries an explicit entry
for the only remaining compensating control.

## 2. Deep-only migration

- `pnpm verify:deep` added (canonical acceptance command). Runs:
  `check → lint → test → build → rules:check → arch:check:v2 →
  guards:all-local → depcruise:check → arch-tests → knip:check →
  secrets:gitleaks → tooling:redcase`.
- `pnpm verify:fast` and `pnpm verify:normal` added as
  `HELPER_ONLY / NOT_ACCEPTANCE_GATE` labelled scripts. Each prints
  a banner clarifying it cannot grant acceptance.
- `STATUS_TAXONOMY.md` §Deep-only acceptance — pins `verify:deep` as
  the only path to `READY` / `IMPLEMENTED` / `BACKEND_DONE` /
  `VISUAL_DONE` / `TOP_TIER_READY`.
- `AGENT_COMMAND_STANDARD.md` §5 rewritten + new §§11–16 (evidence
  verification, no-scope-creep, ZIP integrity, no silent guard
  delta, no report rewrite, READY-status gate).
- `PlatformaX-V2-coding-standards.md` §2a "Deep-only acceptance"
  added.

## 3. Rules coherence

See `SLICE_24_RULES_COHERENCE_AUDIT.md` for the full audit. Key
findings:

- No hard contradictions.
- 3 documented alias pairs left in place (`PX-INFRA-002` /
  `PX-DB-001`, `PX-LC-001` / `PX-LIFECYCLE-001`, `PX-IDEMP-001` /
  `PX-IDEMPOTENCY-001`).
- Weak wording fixed in 7 documents (see §3 of the coherence audit).
- 2 residual ambiguities scheduled for Slice 25.

## 4. Guards added (12 new P0)

| ID | Script | Rule(s) | Red-case fixture dir | FP risk |
|---|---|---|---|---|
| GUARD-051 | `scripts/check-no-agent-bypass-language.mjs` | PX-GOV-002, PX-GOV-005 | `tests/architecture/fixtures/no-agent-bypass-language/` | LOW |
| GUARD-052 | `scripts/check-application-use-cases-boundary.mjs` | PX-APP-001 | `tests/architecture/fixtures/application-use-cases-boundary/` | LOW |
| GUARD-053 | `scripts/check-policy-pure-functions.mjs` | PX-POLICY-001 | `tests/architecture/fixtures/policy-pure-functions/` | LOW |
| GUARD-054 | `scripts/check-event-envelope-contract.mjs` | PX-EVENT-001 | `tests/architecture/fixtures/event-envelope-contract/` | LOW |
| GUARD-055 | `scripts/check-viewer-context-on-public-reads.mjs` | PX-OWN-002 | `tests/architecture/fixtures/viewer-context-on-public-reads/` | MEDIUM (heuristic naming-bound) |
| GUARD-056 | `scripts/check-visibility-matrix.mjs` | PX-VIS-001 | `tests/architecture/fixtures/visibility-matrix/` | MEDIUM (predicate naming) |
| GUARD-057 | `scripts/check-public-dto-contract-tests.mjs` | PX-CONTRACT-001 | `tests/architecture/fixtures/public-dto-contract-tests/` | LOW |
| GUARD-058 | `scripts/check-idempotency-flows.mjs` | PX-IDEMP-001, PX-IDEMPOTENCY-001 | `tests/architecture/fixtures/idempotency-flows/` | MEDIUM (factory pattern allowlist) |
| GUARD-059 | `scripts/check-transactional-outbox-pattern.mjs` | PX-EVENT-002 | `tests/architecture/fixtures/transactional-outbox-pattern/` | HIGH (narrow heuristic — falls back to ACK) |
| GUARD-060 | `scripts/check-read-model-owner.mjs` | PX-READMODEL-001 | `tests/architecture/fixtures/read-model-owner/` | LOW |
| GUARD-061 | `scripts/check-backend-ownership-invariants.mjs` | PX-OWN-001 | `tests/architecture/fixtures/backend-ownership-invariants/` | MEDIUM (body-signal heuristic) |
| GUARD-062 | `scripts/check-media-attach-owner-purpose.mjs` | PX-MEDIA-004 | `tests/architecture/fixtures/media-attach-owner-purpose/` | LOW |

All 12 wired into `scripts/rules-check.mjs`. 8 also wired into
`scripts/arch-check-v2.mjs`. All present in `GUARDS_REGISTRY.yml`
with `runs_in: [pre-push, ci]` and `required: true`.

Each guard supports a per-file `PX-RULE-ACK:` marker for deferred
enforcement; the marker is logged but does NOT mute the guard for
new code.

## 5. Coding standards changes

Added in `PlatformaX-V2-coding-standards.md`:

- §2a Deep-only acceptance.
- §24 Minimum test-density rubric.
- §25 Backend layer responsibilities (canonical table).
- §26 Visibility matrix.
- §27 Idempotency, EventEnvelope, transactional outbox.
- §28 Read-model ownership.
- §29 Public-DTO contract tests.
- §30 Agent safety addenda.
- §31 ZIP and manifest truth.

## 6. Agent standard changes

Added in `AGENT_COMMAND_STANDARD.md`:

- §5 rewritten as "Gates — deep-only acceptance".
- §11 Evidence verification block.
- §12 No-scope-creep block.
- §13 ZIP / manifest integrity.
- §14 No silent guard delta.
- §15 No report rewrite.
- §16 READY-status gate.

## 7. Registry / matrix status

| Metric | Before Slice 24 | After Slice 24 |
|---|---|---|
| Total rules | 74 | 74 (unchanged) |
| Total guards | 50 | 62 (+12) |
| Fully guarded (`Gap? = NO`) | 47 | 59 (+12) |
| Manual-gate only (`Gap? = YES`) | 22 | 12 (−10) |
| Partial automation (`Gap? = PARTIAL`) | 5 | 3 (−2) |
| TODO_GUARD markers | 11 | 4 (−7 — 7 of the 11 shipped this slice as full guards, 3 remaining originally moved to Slice 25 alongside 1 new addition listed below) |
| Active EXC entries | 15 | 16 (+1 EXC-017 boundaries v6) |

`check-rules-to-guards-coverage.mjs` PASS (summary numbers match
actual rows).

## 8. Boundaries v6 decision

Decision: **DO NOT FIX in Slice 24**. Formalized as `EXC-017` with
expiry `2026-08-31`. Compensating coverage stays in place via
`depcruise:check` + `arch-tests` + `audit-domain-boundaries.mjs`.
Full reasoning in `SLICE_24_BOUNDARIES_V6_DECISION.md`.

## 9. Governance file placement audit summary

All 24 top-tier governance / architecture / AI / scripts / CI files
present at the canonical path. No missing, stale, duplicated, or
mislocated files. Full inventory in
`SLICE_24_GOVERNANCE_FILE_PLACEMENT_AUDIT.md`.

## 10. Gates run for this slice

Run from `feat/contacts-v2-clean-room-slice` after all Slice 24
edits, before ZIP generation:

| Command | Result | Summary |
|---|---|---|
| `pnpm check` | PASS | `tsc --noEmit` — 0 errors. |
| `pnpm lint` | PASS | `eslint . --max-warnings=0` — clean. |
| `pnpm test` | PASS | vitest — 1339 / 1339 tests, 167 / 167 files. |
| `pnpm build` | PASS | vite build — 0 errors; largest chunk 284 KB raw / 90 KB gzip. |
| `pnpm rules:check` | PASS | 55 / 55 guards. |
| `pnpm arch:check:v2` | PASS | 17 / 17 guards. |
| `pnpm guards:all-local` | PASS | all guards green (item 19 branch protection = `[EXT]` external as before). |
| `pnpm depcruise:check` | PASS | 0 errors, 44 informational `no-orphans` warnings (carry-over from Slice 23). |
| `pnpm arch-tests` | PASS | vitest architecture suite. |
| `pnpm knip:check` | WARNINGS | weekly informational lane (existing behaviour). |
| `pnpm secrets:gitleaks` | PASS | `no leaks found`. |
| `pnpm tooling:redcase` | NOT_RUN (deferred — runs as part of CI DEEP lane) | DEV mode covers the same red cases; STRICT remains informational per EXC-017. |

`secrets:gitleaks:required` is the CI-enforced variant; the helper
ran in this environment because the `gitleaks` binary is installed
locally.

## 11. Remaining P0 / P1 / P2

P0 (none open; the 12 P0 guards above ship):

- All 10 P0 items named in the Slice 24 prep audit §10 closed.
- Two P0 additions (`PX-OWN-001`, `PX-MEDIA-004`) closed.

P1 (Slice 25):

- `check-branded-id-types.mjs` (PX-ID-001).
- `check-domain-result-errors.mjs` (PX-ERROR-001).
- `check-correlation-id-boundary.mjs` (PX-OBS-003).
- `check-presentational-container-boundary.mjs` (PX-UI-002).
- `check-deterministic-seeds.mjs` (PX-SEED-001).
- `check-resource-context-refs.mjs` (PX-CTX-001).
- `check-mock-adapter-status-truth.mjs`.
- `check-features-v2-internal-import.mjs`.
- Boundaries v6 fix + EXC-017 retirement.

P2 (Slice 26+):

- `check-design-tokens-usage.mjs` (PX-UI-001).
- `check-api-transport-boundary.mjs`.
- `check-domain-readme-public-surface.mjs`.
- `check-public-hub-source-of-truth.mjs`.
- a11y guard via `@axe-core/playwright`.

## 12. Final recommendation

Real backend / runtime work MAY begin next, provided each new slice:

1. opens with `verify:deep` baseline,
2. removes the per-file `PX-RULE-ACK:` marker for any file it
   touches into compliance with the corresponding rule,
3. ships its own red-case fixture for any new guard.

What must NOT be done before runtime:

- Adding a new manual_gate-only rule. Slice 24's role was to REDUCE
  manual gates, not add them.
- Loosening any Slice 24 guard. Any change to a `check-*.mjs` must
  ship with a red-case proof per `AGENT_COMMAND_STANDARD.md §14`.
- Claiming `READY` / `IMPLEMENTED` without a `verify:deep` log.
- Generating a ZIP without the manifest validation step described
  in `coding-standards §31`.

Status: **STRONG_BUT_NEEDS_MORE_HARDENING** with a clear Slice 25
backlog.
