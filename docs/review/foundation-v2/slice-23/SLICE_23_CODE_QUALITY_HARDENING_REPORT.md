# SLICE 23 — Code quality hardening report

> **Date:** 2026-05-30
> **Scope:** Static recheck of `client/src/**`, `server/**`, `shared/**` for
> the disciplined-tooling invariants. **No risky rewrites were made — this
> slice only deletes dead code (see knip register) and migrates ProfilePage
> into AppShell.**

## 1. Search results

| Pattern | Matches (client/src) | Matches (server/**) | Matches (shared/**) | Verdict |
| --- | --- | --- | --- | --- |
| `: any` (type annotation) | 0 source matches (the only hit is a JSDoc comment in a test) | 0 | 0 | **PASS — no new `any` introduced.** |
| `as any` | 0 | 0 | 0 | **PASS** |
| `@ts-ignore` | 0 | 0 | 0 | **PASS** |
| `@ts-expect-error` | 0 | 1 (intentional in `domains-v2/identity/__tests__/contact-access-service.test.ts:176`) | 0 | **PASS — well-commented runtime-guard test.** |
| `it.skip` / `test.skip` / `describe.skip` / `xit(` / `xtest(` / `xdescribe(` | 0 | 0 | 0 | **PASS — no skipped tests.** |
| `TODO` / `FIXME` in production code | 0 | 0 | 0 | **PASS — production paths are clean.** |
| `eslint-disable` | none in this slice's diff | none | none | **PASS — `pnpm lint` runs with `--max-warnings=0`.** |
| `window.alert` / `window.confirm` in production code | 0 | n/a | n/a | **PASS — profile-runtime test enforces this for `client/src/app-v2/profile/**`.** |
| `dangerouslySetInnerHTML` | 0 (only in a security-test assertion) | n/a | n/a | **PASS** |
| `readAsDataURL` / `base64 upload` / `FileReader` | 0 | n/a | n/a | **PASS — media adapter test asserts the prohibition.** |
| `localStorage` / `sessionStorage` as backend | 0 (only mentioned in comments / explicit no-storage tests) | n/a | n/a | **PASS** |
| `@server/*` import from frontend | 0 | n/a | n/a | **PASS** |
| `href="#"` | 0 | n/a | n/a | **PASS — profile-runtime test asserts this.** |
| Placeholder tests (`expect(true).toBe(true)` etc.) | 0 | 0 | 0 | **PASS — `check-placeholder-tests.mjs` PASS.** |

## 2. Findings that were already cleaned by Slice 22A

Slice 22A's hardening already removed:
- The "Wkrótce" placeholder modal in `FloatingNav`.
- The `MOCK_LOCAL_ONLY` / `BACKEND_PARTIAL` / `UI_SHELL_ONLY` user-facing strings.
- The `wkrótce` aria-labels / tooltips on profile and workplace surfaces.
- The depcruise circular dep between `shared/contracts/manage-dashboard.ts` and `…-sections.ts`.

No new occurrences appeared during Slice 23 work.

## 3. Slice 23 actions taken

- Removed unused `ProfileStatusBar` combined wrapper function from
  `client/src/app-v2/profile/sections/ProfileStatusBar.tsx` (see knip
  decision register).
- Deleted `client/src/features-v2/communities-v2/CommunitiesList.tsx`
  (orphan, see knip decision register).
- Migrated `ProfilePage` to `AppShell` and refactored
  `profile-layout.module.css` to expose tokens via `.profileTokens`
  instead of `.page` (no `as any`, no `@ts-ignore`, no skipped tests
  needed — TS check and full vitest suite continue to PASS).
- Added Playwright (`tests/visual-v2/app-v2-screenshots.spec.ts`) — uses
  fully-typed imports, no `any` / cast.
- Added `client/src/features-v2/publishing/useComposerOpenEvent.ts`
  (Slice 22A); the function uses `CustomEvent<ComposerOpenDetail>` and
  guards `typeof window === "undefined"` — no untyped event handling.

## 4. Intentional `@ts-expect-error` retained

`server/domains-v2/identity/__tests__/contact-access-service.test.ts:176`
keeps a single `@ts-expect-error` directive. The comment explains it:
the test deliberately passes an invalid enum literal to the runtime
guard to confirm the guard rejects it. Removing the directive would
require lowering TS strictness or silently `as any`-casting — both of
which are worse. Decision: **KEEP, well-justified.**

## 5. Larger refactors deferred to future slices

- **P2:** `ProfilePage` still inlines a long render tree; once a real
  identity transport is wired the profile route should be split into
  `OwnerProfileRoute` and `ViewerProfileRoute` to remove the
  `editEnabled` boolean propagation. Out of scope for Slice 23.
- **P2:** `features-v2/manage` `mock-adapter` is intentionally large
  (13-section dashboard fixtures). Splitting into per-section seed files
  is cosmetic; defer until backend wiring.
- **P2:** Several `useEffect` blocks in feed/community surfaces use
  `void load()` — a thin `useAsyncEffect` helper could remove
  repetition. Cosmetic; out of scope.

## 6. Result

**PASS** — no new technical debt introduced in Slice 23, the
`any` / `as any` / `@ts-ignore` / placeholder-test counts remain at
**zero** for production code, and the residual single
`@ts-expect-error` in tests is intentional and documented.

— End of Slice 23 code quality hardening report.
