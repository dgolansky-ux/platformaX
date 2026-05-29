# Follow-up: FIX_ESLINT_PLUGIN_BOUNDARIES_V6_ENFORCEMENT

Status: `OPEN`
Owner: Architecture / Governance
Created: 2026-05-29 (tooling/architecture-boundaries-quality-spike)

## Why

`eslint-plugin-boundaries` is installed and loaded but does NOT block any
of the red cases under the v6 release on this codebase:

- The previous v5-style `boundaries/element-types` + `boundaries/entry-point`
  rules are reported by v6 as "legacy selector syntax" and downgraded to
  warnings, so they no longer fail the lint pass.
- A minimal `boundaries/dependencies` migration was attempted in the same
  spike. The source element is correctly typed (`from.type =
  "client-app-v2"`), but the target element comes back as
  `to.isUnknown: true` because:
  1. boundaries cannot resolve the `@server/*` TypeScript path alias
     without `eslint-import-resolver-typescript` wired into the plugin
     settings;
  2. for relative-path targets, `boundaries/elements` needs explicit
     `mode` and `capture` re-modelling to match v6 semantics.

Until both fixes ship together, ESLint enforcement of the architectural
boundaries is `PARTIAL_NOT_ENFORCED`. Coverage is provided by:

- `pnpm depcruise:check` — cycles, `no-client-to-server`,
  `no-cross-domain-internal`, `shared-no-runtime`,
  `no-legacy-runtime-import`;
- `pnpm arch-tests` — Vitest specs covering PX-ARCH-001/003/004/008/009
  + PX-APP-001, including the side-effect-import form;
- `node scripts/audit-domain-boundaries.mjs` — custom guard, hardened on
  2026-05-29 to fail on `@server/*`, relative `../server/**` and
  side-effect imports from both `client/**` and `shared/**`.

## Scope of the follow-up

1. Add `eslint-import-resolver-typescript` to `devDependencies` and wire
   it under `boundaries/settings.resolver` (or via the eslint-plugin-import
   resolver config that boundaries delegates to).
2. Re-model `boundaries/elements` for v6:
   - choose `mode: "file"` vs `mode: "folder"` per element so each file
     under `client/src/app-v2/**`, `client/src/features-v2/<feature>/**`,
     `server/domains-v2/<domain>/**`, `server/application-v2/**`,
     `shared/**` is correctly typed;
   - re-add `capture: ["feature"]` / `capture: ["domain"]` where the v5
     config used them so cross-domain rules can use `captured`.
3. Replace `boundaries/element-types` + `boundaries/entry-point` with the
   unified `boundaries/dependencies` rule using object-based selectors.
   Re-encode every previous rule (app-v2, features-v2, shared-ui,
   server-domain, application-v2, shared, server-root).
4. Re-encode the entry-point restrictions inside
   `boundaries/dependencies` using a `to.internalPath` selector so cross-
   domain imports can only reach `public-api.ts` / `contracts.ts` /
   `events.ts` / `dto.ts` / `repository.ts`.
5. Make `pnpm tooling:redcase --strict` exit 0 with NO TOOL_MISSING rows
   for boundaries (both `client -> @server/*` and `client -> shared ->
   server` planted cases must block through ESLint alone).
6. Update:
   - `docs/architecture/PlatformaX-V2-coding-standards.md §22a` (drop the
     boundaries truth disclosure);
   - `docs/review/tooling-spike/TOOLING_VERIFICATION_REPORT.md` (flip
     boundaries row to `PASS`);
   - this file → mark `Status: DONE`, link the PR.

## Out of scope

- Removing any custom guard. That happens in a separate cleanup PR after
  audit approval; see `GUARDS_REGISTRY.yml` `parallel_status` markers.
