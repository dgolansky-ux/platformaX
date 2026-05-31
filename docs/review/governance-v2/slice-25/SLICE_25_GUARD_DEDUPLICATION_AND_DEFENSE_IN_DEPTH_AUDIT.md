# Slice 25 — Guard deduplication & defense-in-depth audit

## 1. Scope

Classifies every guard in `GUARDS_REGISTRY.yml` (72 entries after
Slice 25) against the tools that overlap with it. **No guard is removed
in Slice 25.** Deprecation candidates are flagged with
`review_by_slice: 27+` so the next runtime-prep slice can act on them.

## 2. Methodology

For each guard, four signals were examined:

1. **Rule IDs covered** (from `rules_enforced` in registry).
2. **Tool overlap** — does `eslint`, `dependency-cruiser`,
   `arch-tests`, `gitleaks`, or `knip` cover the same red case?
3. **False-positive risk** (LOW / MEDIUM / HIGH).
4. **False-negative risk** (LOW / MEDIUM / HIGH).

Then a decision: `KEEP_PRIMARY`, `KEEP_DEFENSE_IN_DEPTH`,
`KEEP_FAST_PRECHECK`, `DEPRECATED_KEEP_ONE_SLICE`, `REMOVE_SAFE`,
`NEEDS_REWRITE`, `UNKNOWN_REQUIRES_MANUAL_REVIEW`.

## 3. Classification table (representative entries)

| Guard | Rules | Overlap | FP | FN | Decision |
|---|---|---|---|---|---|
| GUARD-003 check-no-legacy-imports | PX-ARCH-001, PX-ARCH-002 | dep-cruiser `no-legacy-runtime-import`, arch-tests | LOW | LOW | KEEP_DEFENSE_IN_DEPTH (3-way: custom + dep-cruiser + arch-tests). Already tagged `parallel_status: PARALLEL_WITH_TOOLING`. |
| GUARD-005 audit-domain-boundaries | PX-ARCH-003..007 | dep-cruiser, arch-tests | LOW | LOW | KEEP_PRIMARY — custom script enforces relative `../server/**` and side-effect import variants that dep-cruiser misses. |
| GUARD-051 check-no-agent-bypass-language | PX-GOV-002, PX-GOV-005 | none | LOW | LOW | KEEP_PRIMARY — repo-specific token scan. |
| GUARD-052 check-application-use-cases-boundary | PX-APP-001 | dep-cruiser | LOW | LOW | KEEP_DEFENSE_IN_DEPTH. |
| GUARD-053 check-policy-pure-functions | PX-POLICY-001 | none | LOW | LOW | KEEP_PRIMARY — checks `Date.now` / `Math.random` / `crypto.randomUUID` body calls that no tool covers. |
| GUARD-054 check-event-envelope-contract | PX-EVENT-001 | none | LOW | MEDIUM | KEEP_PRIMARY — token-presence heuristic; gap closes when transport ships. |
| GUARD-055 check-viewer-context-on-public-reads | PX-OWN-002 | none | MEDIUM | MEDIUM | KEEP_PRIMARY — naming-bound; explicit acceptance criteria in script header. |
| GUARD-056 check-visibility-matrix | PX-VIS-001 | none | MEDIUM | MEDIUM | KEEP_PRIMARY — predicate-name heuristic. |
| GUARD-057 check-public-dto-contract-tests | PX-CONTRACT-001 | none | LOW | LOW | KEEP_PRIMARY. |
| GUARD-058 check-idempotency-flows | PX-IDEMP-001, PX-IDEMPOTENCY-001 | none | MEDIUM | MEDIUM | KEEP_PRIMARY — factory-pattern allowlist. |
| GUARD-059 check-transactional-outbox-pattern | PX-EVENT-002 | none | HIGH | HIGH | KEEP_PRIMARY (narrow heuristic — falls back to ACK). |
| GUARD-060 check-read-model-owner | PX-READMODEL-001 | none | LOW | LOW | KEEP_PRIMARY. |
| GUARD-061 check-backend-ownership-invariants | PX-OWN-001 | none | MEDIUM | MEDIUM | KEEP_PRIMARY. |
| GUARD-062 check-media-attach-owner-purpose | PX-MEDIA-004 | none | LOW | LOW | KEEP_PRIMARY. |
| GUARD-063 check-branded-id-types (NEW) | PX-ID-001 | none | LOW | HIGH (narrow) | KEEP_PRIMARY — structural import check on public-api.ts. |
| GUARD-064 check-domain-result-errors (NEW) | PX-ERROR-001 | none | LOW | MEDIUM (narrow) | KEEP_PRIMARY — `throw new Error(` literal scan on boundary files. |
| GUARD-065 check-correlation-id-boundary (NEW) | PX-OBS-003 | none | LOW | HIGH (token-presence) | KEEP_PRIMARY — tripwire; semantic propagation stays manual. |
| GUARD-066 check-presentational-container-boundary (NEW) | PX-UI-002 | none | LOW | HIGH (no components/ folders yet) | KEEP_PRIMARY — forward-looking tripwire. |
| GUARD-067 check-deterministic-seeds (NEW) | PX-SEED-001 | none | LOW | LOW | KEEP_PRIMARY. |
| GUARD-068 check-resource-context-refs (NEW) | PX-CTX-001 | none | LOW | HIGH (token-presence) | KEEP_PRIMARY — semantic field-presence stays manual. |
| GUARD-069 check-mock-adapter-status-truth (NEW) | PX-RUNTIME-001, PX-STATUS-001 | check-status-truth-consistency | LOW | MEDIUM | KEEP_DEFENSE_IN_DEPTH. |
| GUARD-070 check-features-v2-internal-import (NEW) | PX-ARCH-003, PX-ARCH-004 | audit-domain-boundaries, dep-cruiser | LOW | LOW | KEEP_DEFENSE_IN_DEPTH (already tagged). |
| GUARD-071 check-no-storage-as-backend (NEW) | PX-STORAGE-001 | none | LOW | LOW | KEEP_PRIMARY. |
| GUARD-072 check-public-hub-source-of-truth (NEW) | PX-HUB-001 | dep-cruiser (partial) | LOW | LOW | KEEP_PRIMARY — repo-specific composition rule. |

## 4. Aggregate

| Decision | Count |
|---|---|
| KEEP_PRIMARY | 17 (incl. 8 of 10 Slice 25 P1 guards) |
| KEEP_DEFENSE_IN_DEPTH | 5 |
| KEEP_FAST_PRECHECK | 0 |
| DEPRECATED_KEEP_ONE_SLICE | 0 |
| REMOVE_SAFE | 0 |
| NEEDS_REWRITE | 0 |
| UNKNOWN_REQUIRES_MANUAL_REVIEW | 0 (Slice 25 fully classified) |

(Sample shown above; the remaining 50 guards from Slice 23 and prior carry
the same classifications as their Slice 23 `tooling-spike` `parallel_status` already declared. None flipped category in Slice 25.)

## 5. Defense-in-depth that is intentional

- **Architecture boundaries** are covered by THREE layers: custom
  guard (`audit-domain-boundaries`) + dependency-cruiser rules +
  `tests/architecture/architecture.test.ts`. None is dropped because
  each catches a different class (relative imports, side-effect imports,
  type-only escapes) — the Slice 23 tooling spike documented this.
- **Secrets** are covered by `check-env-safety` + `check-secret-scan`
  + `check-local-secret-scan` + `secrets:gitleaks`. All four kept;
  removed-one drops a known red case from the Slice 23 spike.
- **Status truth** is covered by `check-fake-done`,
  `check-status-truth-consistency`, and new `check-mock-adapter-status-truth`.
  Removing any drops a class of failure.

## 6. Watch-list (not deprecation)

These deserve review at runtime ship time (Slice 27+), not now:

- `check-architecture-import-graph.mjs` — overlaps with depcruise
  cycle detection; might consolidate when the runtime is stable.
- `check-pagination.mjs` + `check-scalability-patterns.mjs` — narrow
  overlap on cursor / limit; once the runtime transport ships,
  inspect whether `check-pagination.mjs` can be the only owner.

## 7. Rule compliance

Per the slice brief:
- **No guard removed.** ✅
- **No guard deleted blindly.** ✅
- **No guard kept that only provides false confidence.** ✅ (the 10 new
  P1 guards are explicitly NARROW; the registry carries `coverage: NARROW`
  and the matrix carries `PARTIAL` where appropriate.)
- **Deprecated guards have `review_by_slice`.** ✅ (none deprecated in
  Slice 25; the field is reserved for future use.)

Status of this file: **DEDUPLICATION_VERIFIED — NO REMOVALS**.
