# Slice 25 — Prechange Inventory

> Read-only baseline taken at the start of Slice 25 (FINAL_GOVERNANCE_CLOSURE).
> No code, rules, guards, or registries changed by writing this file.

## 0. Git state at slice start

- Working directory: `C:/Users/dgola/Desktop/PlatformaX-V2-clean`
- Branch: `feat/contacts-v2-clean-room-slice`
- HEAD: `0c22937` (Slice 23 final commit — Slice 24 work is uncommitted)
- Working tree dirty: **YES**
  - 60 modified files (governance / registries / coding-standards / package.json / 38 pre-runtime services with ACK markers / eslint.config.js / 3 events.ts / 4 scaffold public-api.ts / 3 helper scripts).
  - 24 untracked files: 12 new P0 guard scripts, 1 Slice 24 ZIP creator, 1 Slice 24 prep audit doc + 6 Slice 24 reports + 4 red-case fixture files (no-agent-bypass-language/).
- diff stat: 60 files changed, ~766 insertions, ~62 deletions.

## 1. Slice 24 leftovers (untracked / unstaged work)

Untracked Slice 24 artifacts the working tree carries:

- `scripts/check-no-agent-bypass-language.mjs`
- `scripts/check-application-use-cases-boundary.mjs`
- `scripts/check-policy-pure-functions.mjs`
- `scripts/check-event-envelope-contract.mjs`
- `scripts/check-viewer-context-on-public-reads.mjs`
- `scripts/check-visibility-matrix.mjs`
- `scripts/check-public-dto-contract-tests.mjs`
- `scripts/check-idempotency-flows.mjs`
- `scripts/check-transactional-outbox-pattern.mjs`
- `scripts/check-read-model-owner.mjs`
- `scripts/check-backend-ownership-invariants.mjs`
- `scripts/check-media-attach-owner-purpose.mjs`
- `scripts/audit/create-slice-24-deep-only-governance-hardening-zip.mjs`
- `tests/architecture/fixtures/no-agent-bypass-language/{README,bad-status-marker,bad-bypass-phrase,bad-skip-gate-phrase}.md`
- `docs/review/governance-v2/slice-24-prep/SLICE_24_PREP_GOVERNANCE_AND_RULES_AUDIT.md`
- `docs/review/governance-v2/slice-24/SLICE_24_*.md` (6 reports)

These need to land on the feature branch via a commit before Slice 25 can
claim a clean baseline (the brief §2 makes a `_DIRTY` final ZIP
incompatible with TOP_TIER_READY).

## 2. Current `verify:deep` definition

Per `package.json` (added in Slice 24):

```
verify:deep = check && lint && test && build && rules:check &&
              arch:check:v2 && guards:all-local && depcruise:check &&
              arch-tests && knip:check && secrets:gitleaks &&
              tooling:redcase
```

`verify:fast` and `verify:normal` carry the `HELPER_ONLY /
NOT_ACCEPTANCE_GATE` banner.

## 3. Governance registry counts inherited from Slice 24

Verified by `grep` against `docs/governance/`:

| Concept | Count |
| --- | --- |
| Rules in `RULES_REGISTRY.yml` (`- id: PX-*`) | 74 |
| Guards in `GUARDS_REGISTRY.yml` (`- id: GUARD-*`) | 62 (Slice 24: +12) |
| Matrix rows with `Gap? = NO` | 59 |
| Matrix rows with `Gap? = YES` (manual-only) | 12 |
| Matrix rows with `Gap? = PARTIAL` | 3 |
| Explicit `TODO_GUARD:` markers in matrix | 4 (PX-ID-001, PX-UI-002, PX-OBS-003, PX-SEED-001) |
| Active exceptions in `EXCEPTIONS_REGISTER.md` | 16 (EXC-001..015 + EXC-017) |

## 4. Current P0 / P1 / P2 governance gaps

P0 still open (after Slice 24):

- None named in the Slice 24 prep audit `§12 P0_NOW` list. All 10 P0
  guards from prep shipped + 2 additional (`PX-OWN-001`,
  `PX-MEDIA-004`).

P1 still open (Slice 25 candidates):

| TODO_GUARD | Rule | Slice 25 plan |
|---|---|---|
| `check-branded-id-types.mjs` | PX-ID-001 | ship narrow |
| `check-domain-result-errors.mjs` | PX-ERROR-001 | ship narrow |
| `check-correlation-id-boundary.mjs` | PX-OBS-003 | ship narrow |
| `check-presentational-container-boundary.mjs` | PX-UI-002 | ship narrow |
| `check-deterministic-seeds.mjs` | PX-SEED-001 | ship narrow |
| `check-resource-context-refs.mjs` | PX-CTX-001 | ship narrow |
| `check-mock-adapter-status-truth.mjs` | feature-registry consistency | ship narrow |
| `check-features-v2-internal-import.mjs` | feature boundary | ship narrow |
| `check-no-storage-as-backend.mjs` | runtime / no-fake-backend | ship narrow |
| `check-public-hub-source-of-truth.mjs` | Public Hub never owns data | ship narrow |

P2 still open (Slice 26+):

- `check-design-tokens-usage.mjs` (PX-UI-001).
- `check-api-transport-boundary.mjs` (zod-at-transport).
- `check-domain-readme-public-surface.mjs`.
- a11y guard via `@axe-core/playwright`.
- `check-public-hub-source-of-truth` if not landed as P1.

## 5. Boundaries v6 exception status

`EXC-017` registered in `docs/governance/EXCEPTIONS_REGISTER.md`:

- Rule: `PX-GOV-002`.
- Reason: `eslint-plugin-boundaries` v6 `PARTIAL_NOT_ENFORCED` — v6
  reports v5 selector schema as legacy; resolver dependency required.
- Expiry: `2026-08-31`.
- Files: `eslint.config.js` (carries the inline
  `PLATFORMAX_EXCEPTION` marker).
- Compensating coverage: `depcruise:check` + `arch-tests` +
  `audit-domain-boundaries.mjs`.

Slice 25 §7 re-evaluates.

## 6. Files likely to be touched in Slice 25

Implementation:

- `package.json` — keep `verify:deep`, ensure `tooling:redcase` runs
  locally and is required.
- 10 new `scripts/check-*.mjs` files for P1 guards.
- `scripts/rules-check.mjs` and `scripts/arch-check-v2.mjs` — wire
  new guards.
- `scripts/audit/create-slice-25-final-governance-closure-zip.mjs`
  (NEW).
- `tests/architecture/fixtures/<guard-name>/` per new guard.

Registries / docs:

- `docs/governance/GUARDS_REGISTRY.yml` — GUARD-063..072.
- `docs/governance/RULES_REGISTRY.yml` — `enforced_by` updates for the
  4 TODO_GUARD rows + 6 newly addressed rules.
- `docs/governance/RULES_TO_GUARDS_MATRIX.md` — flip rows + summary.
- `docs/governance/EXCEPTIONS_REGISTER.md` — only if any P1 guard
  needs an EXC entry (likely 1 or 2 narrow ACKs).
- `docs/architecture/PlatformaX-V2-coding-standards.md` — micro-edits
  for wording quality pass.

Reports (under `docs/review/governance-v2/slice-25/`):

- `SLICE_25_PRECHANGE_INVENTORY.md` (this file).
- `SLICE_25_SLICE_24_VERIFICATION.md`.
- `SLICE_25_VERIFY_DEEP_FINALIZATION.md`.
- `SLICE_25_GUARD_DEDUPLICATION_AND_DEFENSE_IN_DEPTH_AUDIT.md`.
- `SLICE_25_BOUNDARIES_V6_FINAL_DECISION.md`.
- `SLICE_25_RULE_WRITING_QUALITY_FINAL_PASS.md`.
- `SLICE_25_GOVERNANCE_FILE_PLACEMENT_AND_REGISTRY_CONSISTENCY.md`.
- `SLICE_25_TOOLING_FINAL_DECISION_REGISTER.md`.
- `SLICE_25_FINAL_GOVERNANCE_CLOSURE_REPORT.md`.

ZIP outputs:

- `ZIPY/PlatformaX_V2_SLICE_25_FINAL_GOVERNANCE_CLOSURE_FULL_SOURCE_<sha>.zip` (clean HEAD).
- `ZIPY/PlatformaX_V2_SLICE_25_FINAL_GOVERNANCE_CLOSURE_FULL_SOURCE_<sha>_MANIFEST.json`.
- Copies to `C:/Users/dgola/Desktop/ZIPY/`.

## 7. What this inventory deliberately does NOT do

- It does not commit anything.
- It does not flip any matrix row.
- It does not weaken any guard.
- It does not add or remove rules.
- It does not run any gate yet.

Status of this file: **AUDIT_BASELINE_ONLY**.
