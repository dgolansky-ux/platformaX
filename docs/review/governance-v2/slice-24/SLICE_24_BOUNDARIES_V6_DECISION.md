# Slice 24 — Boundaries v6 Decision

## Context

`eslint-plugin-boundaries` is installed at v6 but the existing rule set
is encoded in the v5 selector schema, which v6 downgrades to a warning.
Fixing it requires:

1. adding `eslint-import-resolver-typescript` as a dev dependency,
2. re-modelling every `boundaries/elements` entry with v6's `mode` and
   `capture` fields,
3. replacing the v5 `boundaries/element-types` + `boundaries/entry-point`
   rules with a single v6 `boundaries/dependencies` rule,
4. re-encoding the entry-point restriction using the
   `to.internalPath` selector,
5. re-running `pnpm tooling:redcase --strict` and the planted red-case
   fixtures.

That is a focused workstream by itself and has a real risk of false
positives during the v5→v6 migration (the `to.isUnknown` issue
documented in
`docs/governance/followups/FIX_ESLINT_PLUGIN_BOUNDARIES_V6_ENFORCEMENT.md`).

Coverage that is ALREADY in place for the same architectural rules
(PX-ARCH-001 / 003 / 004 / 006 / 007 / 008 / 009):

- `pnpm depcruise:check` (cycles, `no-client-to-server`,
  `no-cross-domain-internal`, `shared-no-runtime`,
  `no-legacy-runtime-import`),
- `pnpm arch-tests` (Vitest specs covering side-effect imports,
  cross-domain reach),
- `node scripts/audit-domain-boundaries.mjs` (hardened on 2026-05-29
  against `@server/*`, relative `../server/**`, and side-effect
  imports from both `client/**` and `shared/**`).

`pnpm tooling:redcase --strict` is informational in CI today; the
non-strict variant treats `TOOL_MISSING` for boundaries as
environment-skipped and runs through.

## Decision

**DO NOT fix boundaries v6 in Slice 24.** Slice 24 is a governance /
guards hardening slice and adding a new dev dependency + non-trivial
ESLint config migration is out of scope. Formalize the gap as an
exception so a reviewer can see it explicitly.

### Action taken in Slice 24

1. Added `EXC-017` to `docs/governance/EXCEPTIONS_REGISTER.md` with:
   - Rule: `PX-GOV-002`.
   - Reason: v6 selector-schema downgrade; resolver dependency
     decision required.
   - Expiry: `2026-08-31` (forces an explicit review by the next
     governance audit slice).
   - Owner: `dawid`.
   - Evidence: this file + the followup +
     `tests/architecture/architecture.test.ts`.
   - Risk: a reviewer might assume `pnpm lint` covers boundaries;
     mitigated by `tooling:redcase` running depcruise + arch-tests on
     the same planted cases.
   - Files: `eslint.config.js`.
2. Verified the existing 3-layer defense (depcruise + arch-tests +
   `audit-domain-boundaries.mjs`) is still wired and that the
   architecture test that covers side-effect imports still runs:
   - `pnpm depcruise:check`: PASS (confirmed in `verify:deep` log).
   - `pnpm arch-tests`: PASS (confirmed in `verify:deep` log).
   - `node scripts/audit-domain-boundaries.mjs`: PASS.
3. Kept `eslint.config.js` block that loads the plugin but disables
   `boundaries/no-unknown` so ESLint validates the config without
   pretending v6 enforces the boundaries.

### Action deferred to Slice 25 (or sooner if priorities allow)

- Land `eslint-import-resolver-typescript` via the dependency-decision
  workflow (`docs/governance/AI_AGENT_PERMISSIONS_POLICY.md §Requires
  Separate Owner Decision`).
- Re-encode every `boundaries/elements` entry, switch to v6
  `boundaries/dependencies`, and remove `EXC-017`.
- Flip `tooling:redcase:strict` to required in CI for the boundaries
  red case.

### Why this is honest

- The lint lane today does NOT block the v5-style boundaries red cases.
- Depcruise + arch-tests + the custom guard DO block the same cases.
- The registered exception forces a review at the deadline rather than
  hiding the gap behind a stale followup file.

Status: **EXCEPTION_REGISTERED**.
