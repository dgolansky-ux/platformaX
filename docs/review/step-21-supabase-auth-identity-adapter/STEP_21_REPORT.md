# Step 21 — Supabase Auth Adapter + Identity Auth Integration

Generated: 2026-05-25

Status: `SUPABASE_AUTH_IDENTITY_ADAPTER_PR_READY`

> Filename note: the task brief named this `STEP_21_REVIEW.md`. It is committed
> as `STEP_21_REPORT.md` so the governance guards
> (`check-pre-commit-decision.mjs`, `check-self-audit-evidence.mjs`) actually
> validate its required sections — those guards only inspect files ending in
> `_REPORT.md`. This matches the repo convention (step-11 … step-20).

## Summary

Wired real Supabase Auth into the existing V2 auth/register/onboarding UI shell
through a typed identity auth adapter. The Supabase SDK is isolated to a single
module; UI screens call the adapter, never the SDK. No backend, no database, no
migrations, no Railway, no service-role key on the frontend.

Scope delivered: signUp, signInWithPassword, signOut, resetPasswordForEmail,
getUser (current session/user), and onAuthStateChange — all behind the
`IdentityAuthAdapter` contract owned by the `identity` frontend feature.

## Status truth

- `AUTH_RUNTIME_PARTIAL` — real Supabase Auth runs through the adapter, but
  there is no protected app surface and live end-to-end auth was not verified in
  this change (needs a provisioned Supabase project + browser run).
- `IDENTITY_PROFILE_BACKEND_NOT_STARTED` — no `server/domains-v2/identity`
  runtime; no profile read/write.
- `ONBOARDING_PROFILE_PERSISTENCE_NOT_STARTED` — onboarding stays
  `UI_SHELL_ONLY` / `MOCK_LOCAL_ONLY`; nothing written to Supabase/DB.

`IMPLEMENTED` is **not** claimed.

## Baseline

- Branch: `feat/supabase-auth-identity-adapter` (cut from `main` at `98af220`)
- Pre-flight verified on `main`: landing page present, root route renders it,
  auth/register/onboarding shell present, routes `/login` `/register`
  `/reset-password` `/check-email` `/onboarding` present, step-20 report present.
- Forbidden actions reviewed: no legacy runtime imports, no service-role key on
  frontend, no DB URL on frontend, no db push, no migrations, no Railway, no
  fake DONE, no guard weakening.

## Architecture

Layering: `UI (app-v2/auth)` → `IdentityAuthAdapter` → `AuthBackend` → Supabase SDK.

- `client/src/features-v2/identity/auth/types.ts` — typed contracts
  (`IdentityAuthAdapter`, `AuthBackend`, `AuthResult`, `AuthUser`, `AuthError`).
- `client/src/features-v2/identity/auth/auth-adapter.ts` — orchestration +
  safe error mapping (Polish, no provider internals leaked). Pure; unit-testable
  with a fake backend.
- `client/src/features-v2/identity/auth/supabase-client.ts` — the **only**
  module importing `@supabase/supabase-js`. Reads `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY`; if absent, the client is `null` and `isConfigured()`
  is false (no crash, no fake session).
- `client/src/features-v2/identity/index.ts` — public entrypoint exposing the
  `identityAuthAdapter` singleton. app-v2 imports from here.

The auth screens accept an optional `authAdapter` prop defaulting to the
singleton, so tests inject a typed fake without mocking modules or hitting the
network.

## Changed files

### Modified

| Path | Notes |
|---|---|
| `package.json` | Adds production dependency `@supabase/supabase-js@^2.106.1` |
| `pnpm-lock.yaml` | Lockfile for the new dependency |
| `vite-env.d.ts` | Types `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` on `ImportMetaEnv` |
| `.env.example` | Adds public Supabase frontend placeholders (no secrets) |
| `client/src/features-v2/identity/index.ts` | Public entrypoint; exports `identityAuthAdapter` + types |
| `client/src/features-v2/identity/README.md` | Status → `PARTIAL`, honest scope notes |
| `client/src/app-v2/auth/RegisterRoute.tsx` | Real `signUp`; success → `/check-email`; errors in UI |
| `client/src/app-v2/auth/LoginRoute.tsx` | Real `signIn`; success → `/onboarding`; errors in UI |
| `client/src/app-v2/auth/ResetPasswordRoute.tsx` | Real `resetPassword`; generic confirmation; errors in UI |
| `client/src/app-v2/auth/__tests__/RegisterRoute.test.tsx` | Injects fake adapter; asserts signUp + no e-mail in URL + error render |
| `client/src/app-v2/auth/__tests__/LoginRoute.test.tsx` | Injects fake adapter; asserts signIn + navigation + error render |
| `client/src/app-v2/auth/__tests__/ResetPasswordRoute.test.tsx` | Injects fake adapter; asserts resetPassword + generic confirmation + error render |

### New

| Path | Notes |
|---|---|
| `client/src/features-v2/identity/auth/types.ts` | Auth contracts |
| `client/src/features-v2/identity/auth/auth-adapter.ts` | Identity auth adapter + error mapping |
| `client/src/features-v2/identity/auth/supabase-client.ts` | Sole Supabase SDK boundary |
| `client/src/features-v2/identity/auth/__tests__/auth-adapter.test.ts` | Adapter unit tests (calls + error mapping + NOT_CONFIGURED guard) |
| `client/src/features-v2/identity/auth/__tests__/frontend-auth-boundaries.test.ts` | Architecture/env tests (SDK isolation, no service-role/DB-URL, VITE-only env) |
| `client/src/app-v2/auth/__tests__/auth-test-helpers.ts` | Typed fake adapter builder for UI tests |
| `docs/review/step-21-supabase-auth-identity-adapter/STEP_21_REPORT.md` | This report |
| `docs/review/REVIEW_REPORTS_INDEX.md` | Adds step-21 entry |

No files deleted. No guard scripts modified (`git diff scripts/` empty).

## Architecture Impact Statement

Introduces the first real runtime in the `identity` frontend feature: a Supabase
Auth adapter behind a typed contract. The application-shell auth screens
(`app-v2/auth`) now call this adapter instead of showing "not available"
notices. One new production dependency (`@supabase/supabase-js`). No backend V2
domain touched (`server/domains-v2/identity` untouched). No cross-domain deep
imports — app-v2 consumes only the identity feature's public entrypoint; the
identity feature imports only its own modules + the SDK (in one file). The
Supabase coupling is confined to `supabase-client.ts`, enforced by an
architecture test.

## Dependency changes

- Added: `@supabase/supabase-js@^2.106.1` (production dependency).
- Lockfile updated. No other dependencies added or removed.

## Env changes

- `.env.example`: added `VITE_SUPABASE_URL=` and `VITE_SUPABASE_ANON_KEY=`
  (empty placeholders, public frontend values only).
- `vite-env.d.ts`: typed the two public vars.
- No `.env` file is tracked. Tests do not read real env (the adapter is faked;
  the SDK module degrades to "not configured" when env is absent).

## Security confirmations

- **No `SUPABASE_SERVICE_ROLE_KEY` in the frontend** — only the anon/public key
  is read; an architecture test asserts the token is absent from the frontend
  tree.
- **No `DATABASE_URL` in the frontend** — asserted by the same test; no
  `postgresql://` anywhere in the frontend.
- **No db push.** **No migrations.** **No Railway.** Nothing in this change
  touches infrastructure or deployment.
- **No legacy runtime imports** — verified by `check-no-legacy-imports.mjs`.
- **No direct Supabase coupling in arbitrary components** — only
  `supabase-client.ts` imports the SDK; verified by
  `frontend-auth-boundaries.test.ts`.
- **No PII in auth metadata** — `signUp` sends only email + password. Onboarding
  PII (phone, date of birth) never reaches Supabase; it stays in local
  `useState`.
- **No fake auth via `localStorage`/`sessionStorage`** — none used; Supabase
  manages its own session storage internally.

## Routing / behavior

- Register: client-side validation → `adapter.signUp(email, password)` → on
  success navigate to `/check-email` (no e-mail in URL); on error a safe Polish
  message renders inline.
- Login: validation → `adapter.signInWithPassword` → on success navigate to
  `/onboarding` (there is no protected app route yet — see limitations); on
  error a safe message renders.
- Reset: validation → `adapter.resetPasswordForEmail` → generic confirmation
  that does not confirm whether the address exists (anti-enumeration); redirect
  target derived at runtime from `window.location.origin` (no hardcoded domain).
- `getCurrentUser` / `onAuthStateChange` are implemented and unit-tested but not
  yet wired to a screen (no protected surface exists).

## Gates

All commands run from repo root on Windows 11 / PowerShell, `pnpm` 11.x.

| Gate | Command | Status |
|---|---|---|
| TypeScript | `pnpm check` | PASS |
| Lint | `pnpm lint` | PASS |
| Tests | `pnpm test` | PASS (296/296, 41 files) |
| Build | `pnpm build` | PASS |
| Rules umbrella | `pnpm rules:check` | PASS (21/21) |
| Arch umbrella | `pnpm arch:check:v2` | PASS (9/9) |
| Domain registries | `pnpm guards:domains` | PASS |
| Secret scan | `pnpm guards:secrets` | PASS |
| Review index | `pnpm guards:review` | PASS |
| Self-audit | `pnpm guards:self-audit` | PASS |
| BRAMKA | `pnpm guards:bramka` | PASS (25/25) |
| All-local | `pnpm guards:all-local` | PASS |
| Build artifacts | `node scripts/check-build-artifacts.mjs` | PASS |

## Domain Status Impact

| Domain | Previous status | New status | Evidence | Notes |
|---|---|---|---|---|
| features-v2/identity | SCAFFOLD_ONLY | PARTIAL | auth adapter + tests + this report | real Supabase auth runtime via adapter; profile backend not started |
| server/domains-v2/identity | PLANNED | PLANNED | unchanged | backend not started |
| app-v2/auth | UI_SHELL_ONLY | PARTIAL | wired to adapter | real auth calls; no protected surface |
| app-v2/onboarding | UI_SHELL_ONLY / MOCK_LOCAL_ONLY | unchanged | — | no persistence |

`docs/architecture/PlatformaX-V2-domain-status.md` is left unchanged: its
`identity` row tracks the backend owner domain (still not started) and the
frontend `features-v2` row is generic. The precise per-feature status is
recorded here and in the identity feature README.

## PRE-COMMIT DECISION

- Changed files: 12 modified + 8 new (see tables above)
- Domains touched: `features-v2/identity` (new auth runtime), `app-v2/auth`
  (wired to adapter). No backend domain touched.
- Cross-domain imports: none forbidden — app-v2 imports the identity feature's
  public entrypoint; identity imports only its own modules + the SDK (one file)
- Legacy runtime imports: none
- Removed routes/nav/build chunks: none — no removed product areas anywhere
- Public DTO PII: none — no server DTOs; `AuthUser` (own auth subject) lives on
  the client only; onboarding PII stays in `useState`
- Media base64/dataUrl: none
- List pagination/limit/cursor: N/A — no runtime lists added
- Fake DONE/status truth: none — status is `AUTH_RUNTIME_PARTIAL` +
  `IDENTITY_PROFILE_BACKEND_NOT_STARTED` + `ONBOARDING_PROFILE_PERSISTENCE_NOT_STARTED`
- Env safety: only public `VITE_SUPABASE_*` placeholders added to `.env.example`;
  no service-role key, no DB URL, no `.env` tracked
- TypeScript: PASS
- V2 lint: PASS
- Tests: PASS (296/296)
- Build: PASS
- Commit decision: COMMIT_ALLOWED — all gates green, scope matches the task,
  no backend/DB/infra touched

## SELF-AUDIT / INDEPENDENT REVIEW PASS

| # | Question | Answer |
|---|---|---|
| 1 | What I changed | Added the identity auth layer (`types.ts`, `auth-adapter.ts`, `supabase-client.ts`, two test files), exposed `identityAuthAdapter` from the identity barrel, added a typed fake-adapter test helper, wired Register/Login/Reset screens to the adapter, added `@supabase/supabase-js`, typed the two public env vars, and added `.env.example` placeholders. Added this report + index entry. |
| 2 | What I might have broken | Auth screens changed from honest shells to real calls. Risk contained: screens accept an injectable adapter and default to a singleton that is "not configured" when env is absent, so nothing crashes without Supabase. All UI tests updated to inject fakes and pass. No backend/domain/guard files touched. |
| 3 | Domain boundaries affected | `features-v2/identity` gains runtime; `app-v2/auth` consumes only its public entrypoint. No other feature/domain touched. |
| 4 | Cross-domain imports check | Verified by `pnpm guards:domains` / `audit-domain-boundaries.mjs` (PASS) and by `frontend-auth-boundaries.test.ts`. app-v2 → identity public entrypoint only; identity → own modules + SDK in one file. |
| 5 | Legacy/runtime check | `check-no-legacy-imports.mjs` PASS. No imports from `client/src/features/`, `pages/`, `components/`, `server/domains/`, or any legacy path. Relative path `../../features-v2/identity` does not match the `features/` legacy keyword. |
| 6 | Fake DONE/status truth check | `check-fake-done.mjs` PASS. No `DONE`/`CLEAN`/`COMPLETE`/`production-ready`. Honest partial statuses used. |
| 7 | PII/base64/secrets check | `check-public-dto-pii.mjs`, `check-media-base64.mjs`, both secret scanners, `check-env-safety.mjs` PASS. Only the anon key is read. Service-role key and DB URL are asserted absent from the frontend. signUp carries no PII metadata. |
| 8 | Routes/nav/build graph check | `check-build-artifacts.mjs` + `check-removed-product-areas.mjs` PASS. Routes are unchanged structurally; only handlers now call the adapter. No removed area reintroduced. |
| 9 | Guard weakening check | No guard modified — `git diff scripts/` empty. No allowlist widened, no regex relaxed. New tests are additive. |
| 10 | Evidence reviewed | This report; the Gates table outputs; `git status` / `git diff --stat`; per-file reads of the adapter, client, and wired screens. |
| 11 | Gates run | `pnpm check`, `lint`, `test`, `build`, `rules:check`, `arch:check:v2`, `guards:domains`, `guards:secrets`, `guards:review`, `guards:self-audit`, `guards:bramka`, `guards:all-local`, `node scripts/check-build-artifacts.mjs`. |
| 12 | Remaining risks | (a) No live end-to-end auth verification — requires a provisioned Supabase project + browser; tests use fakes/degraded client. (b) No protected app route — login lands on `/onboarding`. (c) No onboarding persistence. (d) Error classification is keyword/status based and may map some provider errors to `UNKNOWN` (still a safe message). |

## Honest limitations

- Real Supabase Auth runs through the adapter, but **live end-to-end auth was
  not verified** in this change (no Supabase project credentials available; the
  SDK degrades to "not configured" without env, and tests use a typed fake).
- No protected application surface yet — successful login routes to `/onboarding`.
- No identity profile backend; no onboarding profile persistence.
- No db push, no migrations, no Railway, no production setup.

## Blockers

None.

## Next step

- Provision a Supabase project, set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`,
  and verify the flows live in a browser.
- Start the identity profile backend and a protected app route; wire
  `getCurrentUser` / `onAuthStateChange` into a session guard.
- Add onboarding profile persistence once the profile backend exists.
