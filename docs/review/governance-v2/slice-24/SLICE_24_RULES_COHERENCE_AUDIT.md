# Slice 24 — Rules Coherence Audit

> Read-only review of `docs/governance/**`, `docs/architecture/**`,
> `docs/ai/**` for contradictions, duplicates, weak wording, and
> ambiguity. Edits made as a result of this audit are documented in
> §Improvements.

## 1. Contradictions found

None hard. The matrix and registry agreed before the slice, and the
Slice 24 prep audit confirmed internal consistency. Slice 24's edits
keep the same invariants and only widen `enforced_by` lists, flip
`Gap?` columns, and update summary counts.

## 2. Duplicates / aliased rules (documented, not removed)

The following alias pairs share semantic content but exist for
governance clarity. Slice 24 leaves them in place:

| Aliases | Why kept |
|---|---|
| `PX-INFRA-002` and `PX-DB-001` (no live db push) | First is infrastructure-class, second is db-class; both point at the same guard. |
| `PX-LC-001` and `PX-LIFECYCLE-001` (lifecycle status) | Different source docs (`BACKEND_ARCHITECTURE_INVARIANTS` vs runtime addendum); both list `manual_gate`. |
| `PX-IDEMP-001` and `PX-IDEMPOTENCY-001` (idempotency) | First is the command-side rule, second is the storage-table side; Slice 24 routes both to `check-idempotency-flows.mjs` until the table guard ships. |

A future slice may consolidate them; doing so within Slice 24 would
require touching every doc that references the original IDs and is
out of scope.

## 3. Weak wording — improved by Slice 24

| Doc | Before | After |
|---|---|---|
| `STATUS_TAXONOMY.md` | Allowed `READY` / `IMPLEMENTED` without naming a single canonical gate. | Added §"Deep-only acceptance" that pins `pnpm verify:deep` as the only acceptance gate. Helper modes labeled `HELPER_ONLY / NOT_ACCEPTANCE_GATE`. |
| `AGENT_COMMAND_STANDARD.md` §5 | Listed `pnpm check + lint + test + build + rules:check + arch:check:v2` as a commit gate without distinguishing acceptance from commit-readiness. | Rewrote as "Gates — deep-only acceptance" with the full 12-step `verify:deep` pipeline + the 6-step commit floor. |
| `AGENT_COMMAND_STANDARD.md` (new §§11–16) | Honor-system evidence, ZIP semantics undocumented, READY-status gate implicit. | Added §11 Evidence verification block, §12 No-scope-creep, §13 ZIP integrity, §14 No silent guard delta, §15 No report rewrite, §16 READY-status gate. |
| `PlatformaX-V2-coding-standards.md` | No "test density rubric", no canonical backend-layer responsibilities table, no idempotency/envelope/outbox section, no visibility-matrix wording. | Added §§24–31: test density, backend layer table, visibility matrix, idempotency / EventEnvelope / outbox, read-model owner, public-DTO contract tests, agent safety addenda, ZIP/manifest truth. |
| `EXCEPTIONS_REGISTER.md` | Boundaries v6 was tracked only in followups; no exception entry. | Added `EXC-017` formalizing the v6 gap with expiry `2026-08-31`. |
| `EXCEPTIONS_REGISTER.md` | No registry of pre-runtime ACK files for Slice 24 new guards. | Added `EXC-016` listing the ~45 pre-runtime files that now carry `PX-RULE-ACK:` markers. |
| `RULES_REGISTRY.yml` | 11 rules had `enforced_by: [manual_gate]` only, with a "TODO_GUARD" note in registry comments. | Added the corresponding `check-*.mjs` to `enforced_by` and rewrote `notes` to point at the marker contract under EXC-016. |
| `RULES_TO_GUARDS_MATRIX.md` | Summary counted 47 NO / 22 YES / 5 PARTIAL / 11 TODO_GUARD. | Now 59 NO / 12 YES / 3 PARTIAL / 4 TODO_GUARD (verified by `check-rules-to-guards-coverage.mjs`). |

## 4. Ambiguity remaining after Slice 24

- `STATUS_TAXONOMY.md` still lets the agent choose between `PARTIAL`
  and `BACKEND_PARTIAL` for partly-implemented backend work. The
  taxonomy explains each but does not name the canonical choice.
  Slice 25 P1: collapse to one of the two and mark the other as
  alias.
- The Slice 24 guards introduce file-level `PX-RULE-ACK:` markers as
  the deferral contract. The CONTRACT itself is now spread across
  the per-guard JSDoc and §27 of `coding-standards`. Slice 25 P1:
  consolidate the marker contract into a single one-pager so an
  agent sees the full list in one place.

## 5. Files changed by this audit

- `docs/governance/RULES_REGISTRY.yml`
- `docs/governance/RULES_TO_GUARDS_MATRIX.md`
- `docs/governance/GUARDS_REGISTRY.yml`
- `docs/governance/STATUS_TAXONOMY.md`
- `docs/governance/AGENT_COMMAND_STANDARD.md`
- `docs/governance/EXCEPTIONS_REGISTER.md`
- `docs/architecture/PlatformaX-V2-coding-standards.md`

No historical reports were edited.

## 6. Manual-only rules remaining (after Slice 24)

`Gap? = YES` rows that the slice deliberately left manual:

- `PX-PROFILE-001` (visual parity 1:1) — inherently visual; needs
  screenshots.
- `PX-PROFILE-002` (professional as identity layer) — structural
  review.
- `PX-AI-001` (agent reads governance first) — agent self-reports.
- `PX-AI-003` (agent BLOCKED on conflict) — agent self-reports.
- `PX-CTX-001` (resource context refs) — schema-shape; harder static
  rule.
- `PX-LC-001` / `PX-LIFECYCLE-001` (lifecycle statuses) — schema /
  migration-shape; harder static rule.
- `PX-UI-001` (design tokens) — visual review.
- `PX-UI-002` (presentational/container) — Slice 25 P1.
- `PX-OBS-003` (correlation ID) — Slice 25 P1.
- `PX-SEED-001` (deterministic seeds) — Slice 25 P1.
- `PX-ID-001` (branded IDs) — Slice 25 P1.
- `PX-ERROR-001` (Result/DomainError) — Slice 25 P1.

## 7. Accepted exceptions remaining

- `EXC-001..015` — pre-existing file-size exceptions (size budgets).
- `EXC-016` — Slice 24 pre-runtime ACK group (file list above).
- `EXC-017` — boundaries v6 `PARTIAL_NOT_ENFORCED` (expiry 2026-08-31).

No exception is open-ended without an expiry / review date.

Status: **COHERENCE_AUDIT_DONE**.
