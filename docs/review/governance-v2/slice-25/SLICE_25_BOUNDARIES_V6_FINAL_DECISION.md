# Slice 25 — Boundaries v6 final decision

## 1. Decision

**EXCEPTION_EXPLICIT_AND_ACCEPTED.** EXC-017 remains active with no
change in scope. The v6 fix is **NOT** undertaken in Slice 25.

## 2. Why not fix now

The fix requires:

1. Adding `eslint-import-resolver-typescript` as a `devDependency` —
   a NEW dependency.
2. Re-encoding `boundaries/dependencies` in `eslint.config.js` from
   the v5 selector schema to the v6 schema (selectors become role
   strings backed by the resolver).
3. Re-baselining lint output across `client/`, `server/`, `shared/`
   (potentially dozens of new findings to triage).

This is non-trivial work that introduces a new dependency. Per
`coding-standards §22 / PX-DEPS-001`, dependency additions need an
explicit decision report. Slice 25 is a **governance closure** slice
— adding a dependency is out of scope.

## 3. Why this is safe

Compensating coverage is **already in place** and was re-verified at
the start of Slice 25:

- `pnpm depcruise:check` runs the rules `no-client-to-server`,
  `no-cross-domain-internal`, `shared-no-runtime`, `no-legacy-runtime-import`,
  and cycle detection. Configured in `.dependency-cruiser.cjs`.
- `pnpm arch-tests` (`tests/architecture/architecture.test.ts`)
  exercises the same red cases via `audit-domain-boundaries.mjs` AND
  via direct file-system scanning for `@server/*`, relative
  `../server/**`, and side-effect imports.
- `pnpm tooling:redcase` includes 1 case for the v6 gap, marked
  `TOOL_MISSING` in DEV mode and documented in `EXC-017`'s
  compensating-coverage note. The same case BLOCKS via dep-cruiser +
  arch-tests, so the red path still fails.

## 4. EXC-017 hygiene

- **Expiry:** `2026-08-31` (unchanged).
- **Review_by_slice:** N/A — single-task fix scheduled before expiry.
- **Mitigation explicit:** YES (re-quoted above).
- **No report claims full `eslint-plugin-boundaries` enforcement:**
  CONFIRMED. `docs/governance/followups/FIX_ESLINT_PLUGIN_BOUNDARIES_V6_ENFORCEMENT.md`
  carries the `PARTIAL_NOT_ENFORCED` status; the Slice 24 report and
  this file repeat it; `tooling:redcase` reports `TOOL_MISSING`.

## 5. Trigger for Slice N+1 retirement

The fix becomes mandatory in the slice that:

- introduces a real transport layer (so boundary regressions can hit
  shipped code), **or**
- approaches the `2026-08-31` expiry, **or**
- adds any other ESLint plugin that requires
  `eslint-import-resolver-typescript` (zero-cost piggy-back).

When triggered: ship `eslint-import-resolver-typescript` + re-encode
the v6 schema + run `tooling:redcase --strict` + close EXC-017 in the
same slice commit.

## 6. Accepted statuses considered

- `FIXED_AND_EXCEPTION_CLOSED` — REJECTED. Out of scope for a
  governance-closure slice; needs dependency decision.
- `EXCEPTION_EXPLICIT_AND_ACCEPTED` — **CHOSEN.** All conditions met.
- `BLOCKED` — REJECTED. Compensating coverage is real and
  verifiable; the situation is not blocking governance closure.

Status of this file: **EXC-017 RECONFIRMED**.
