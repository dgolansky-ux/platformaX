# Step 20 — Auth + Register + Onboarding (UI shell)

Generated: 2026-05-25

Status: `AUTH_REGISTER_ONBOARDING_SHELL_PR_READY`

## Summary

Added the first client-side routed surfaces for PlatformaX V2 on top of the
public landing page shipped in step-19. The work introduces a router
(`react-router-dom` v7 — the only new dependency), four authentication
screens, and a five-step onboarding flow. Everything lives in the `app-v2`
shell composition layer. There is **no backend**, no Supabase/Railway, no
fake auth, and no persistence — auth screens are honest UI shells and the
onboarding flow keeps its data only in React `useState`.

The landing page CTAs that were explicit `href="#"` placeholders in step-19
are now repointed to real client routes (`<Link to="/login">` /
`<Link to="/register">`).

## Baseline

- Branch: `feat/auth-register-onboarding-shell` (cut from `main` at `884175c`)
- Initial gates state: all BRAMKA acceptance points PASS on `main`
- Forbidden actions reviewed: no removed product areas, no legacy runtime
  imports, no public PII, no secrets, no base64, no fake DONE strings, no
  guard weakening

## Scope

Requested / delivered:

- Client-side router for the V2 app shell (6 routes + catch-all)
- `/login` — login UI shell with an honest "logowanie nie jest jeszcze
  dostępne" notice (no auth backend)
- `/register` — registration form with local validation; submit navigates to
  `/check-email?email=…`
- `/reset-password` — UI shell "wiadomość przygotowana" notice
- `/check-email` — honest UI-shell notice + link to `/onboarding`
- `/onboarding` — five-step flow (name → birthday → phone → avatar →
  profile), mock-local state, progress indicator
- Landing CTA repoint from `href="#"` placeholders to real routes
- Smoke tests for every new surface
- All gates clean

Not touched:

- `identity` V2 domain — `server/domains-v2/identity` untouched
  (`BACKEND_NOT_STARTED`)
- Any feature-domain runtime (`client/src/features-v2/`, `server/domains-v2/`)
- Supabase / Railway / database / migrations
- Any guard, governance doc, or domain-registry entry

## Status truth

| Area | Status |
|---|---|
| `app-v2/auth` | `UI_SHELL_ONLY` / `BACKEND_NOT_STARTED` |
| `app-v2/onboarding` | `UI_SHELL_ONLY` / `MOCK_LOCAL_ONLY` / `BACKEND_NOT_STARTED` |
| `app-v2/landing` | `UI_SHELL_ONLY` (unchanged; only CTAs repointed) |
| `identity` (V2 domain) | `BACKEND_NOT_STARTED` (no change) |

`IMPLEMENTED` is **not** claimed for any part of this work.

## Changed files

### Modified

| Path | Action | Notes |
|---|---|---|
| `client/src/App.tsx` | Modified | Renders `<AppRouter />` instead of `<LandingPage />` directly |
| `client/src/App.test.tsx` | Modified | Asserts the hero H1 via the router |
| `client/src/app-v2/README.md` | Modified | Documents auth + onboarding shell scope and constraints |
| `client/src/app-v2/landing/__tests__/LandingPage.test.tsx` | Modified | Wrapped in `<MemoryRouter>`, updated to real routes |
| `client/src/app-v2/landing/sections/SiteHeader.tsx` | Modified | `href="#"` → `<Link to="/login">` / `<Link to="/register">` |
| `client/src/app-v2/landing/sections/HeroSection.tsx` | Modified | `href="#"` → real `<Link>` routes |
| `client/src/app-v2/landing/sections/FinalCtaSection.tsx` | Modified | `href="#"` → real `<Link>` routes |
| `package.json` | Modified | Adds `react-router-dom@^7.15.1` (only new dependency) |
| `pnpm-lock.yaml` | Modified | Lockfile for the new dependency |

### New — router

| Path | Notes |
|---|---|
| `client/src/app-v2/AppRouter.tsx` | `BrowserRouter` + 6 routes + catch-all `<Navigate to="/" replace />` |

### New — auth

| Path | Notes |
|---|---|
| `client/src/app-v2/auth/AuthLayout.tsx` | Shared two-column auth layout |
| `client/src/app-v2/auth/AuthLayout.module.css` | Layout styling |
| `client/src/app-v2/auth/AuthBrandPanel.tsx` | Brand/marketing side panel |
| `client/src/app-v2/auth/AuthBrandPanel.module.css` | Brand panel styling |
| `client/src/app-v2/auth/LoginRoute.tsx` | Login UI shell + honest FormNotice |
| `client/src/app-v2/auth/RegisterRoute.tsx` | Register form, local validation, navigate to `/check-email` |
| `client/src/app-v2/auth/ResetPasswordRoute.tsx` | Reset-password UI shell |
| `client/src/app-v2/auth/CheckEmailRoute.tsx` | Check-email UI shell + link to `/onboarding` |
| `client/src/app-v2/auth/forms/FormField.tsx` | Reusable labelled text field |
| `client/src/app-v2/auth/forms/FormField.module.css` | Field styling |
| `client/src/app-v2/auth/forms/PasswordField.tsx` | Password field with show/hide toggle |
| `client/src/app-v2/auth/forms/SubmitButton.tsx` | Submit button |
| `client/src/app-v2/auth/forms/SubmitButton.module.css` | Submit button styling |
| `client/src/app-v2/auth/forms/FormStack.module.css` | Shared form layout styling |
| `client/src/app-v2/auth/forms/validation.ts` | Pure local validators (email/password/required) |
| `client/src/app-v2/auth/__tests__/validation.test.ts` | Validator unit tests |
| `client/src/app-v2/auth/__tests__/LoginRoute.test.tsx` | Login shell smoke test |
| `client/src/app-v2/auth/__tests__/RegisterRoute.test.tsx` | Register validation + navigation test |
| `client/src/app-v2/auth/__tests__/ResetPasswordRoute.test.tsx` | Reset-password shell test |
| `client/src/app-v2/auth/__tests__/CheckEmailRoute.test.tsx` | Check-email shell test |

### New — onboarding

| Path | Notes |
|---|---|
| `client/src/app-v2/onboarding/OnboardingFlow.tsx` | 5-step flow controller (313 lines, under the 350 limit), mock-local `useState` |
| `client/src/app-v2/onboarding/OnboardingFlow.module.css` | Flow styling |
| `client/src/app-v2/onboarding/OnboardingProgress.tsx` | Step progress indicator |
| `client/src/app-v2/onboarding/OnboardingProgress.module.css` | Progress styling |
| `client/src/app-v2/onboarding/steps/Step1Name.tsx` | Name step |
| `client/src/app-v2/onboarding/steps/Step2Birthday.tsx` | Birthday step |
| `client/src/app-v2/onboarding/steps/Step3Phone.tsx` | Phone step |
| `client/src/app-v2/onboarding/steps/Step4Avatar.tsx` | Avatar step |
| `client/src/app-v2/onboarding/steps/Step5Profile.tsx` | Profile summary step |
| `client/src/app-v2/onboarding/steps/steps.module.css` | Shared step styling |
| `client/src/app-v2/onboarding/__tests__/OnboardingFlow.test.tsx` | PII-no-leak + validation tests |

### New — docs

| Path | Notes |
|---|---|
| `docs/handoff/HAND001.md` | Handoff brief for this step |
| `docs/review/step-20-auth-register-onboarding-shell/STEP_20_REPORT.md` | This report |
| `docs/review/REVIEW_REPORTS_INDEX.md` | Updated — adds step-20 entry |

No files were deleted from existing scaffold or governance areas.

## Legacy reference used

`~/Desktop/Starykod-4-readonly/PlatformaX/client/src/features/system/pages/{LoginPage,RegisterPage,Onboarding,OnboardingSteps}.tsx`
was consulted **READ-ONLY**. What was reused: microcopy wording, onboarding
step ordering, the "show password" toggle pattern, and the "privacy hint"
pattern for PII fields. What was **not** copied: source code, imports, hooks,
tRPC, or Supabase coupling. There are no runtime imports from any legacy path.

## Confirmations (explicit)

- No legacy runtime imports
- No Supabase / Railway / db push / migrations
- No `localStorage` / `sessionStorage` used as fake auth (grep: none)
- No `href="#"` placeholders — all auth CTAs use real routes (grep: none)
- No `window.alert` / `window.confirm` (grep: none)
- No fake DONE / banned status strings
- No public PII — no DTOs exist; PII lives only in `useState`
- No cross-domain deep imports — all new imports are relative within
  `app-v2/auth` / `app-v2/onboarding`, plus `react` and `react-router-dom`
- No guard weakening — `git diff scripts/` is empty

## Architecture Impact Statement

This step adds an application-shell composition: a client-side router
(`AppRouter`) and the auth + onboarding surfaces it routes to, all under
`client/src/app-v2/`. Per `PlatformaX-V2-active-rules.md`, `app-v2` may
compose UI but must not own data or import legacy/removed areas — respected
here (state is local `useState` only, no data layer).

One new dependency: `react-router-dom@^7.15.1`. No V2 domain — frontend
(`client/src/features-v2/`) or backend (`server/domains-v2/`) — was touched.
No backend runtime added (`server/` untouched). No domain was registered or
upgraded.

## Routing / URL

| Route | Element | Purpose |
|---|---|---|
| `/` | `LandingPage` | Public landing (step-19) |
| `/login` | `LoginRoute` | Login UI shell |
| `/register` | `RegisterRoute` | Registration form |
| `/reset-password` | `ResetPasswordRoute` | Reset-password UI shell |
| `/check-email` | `CheckEmailRoute` | Post-register check-email notice |
| `/onboarding` | `OnboardingFlow` | 5-step onboarding |
| `*` | `<Navigate to="/" replace />` | Catch-all redirect to landing |

- Local dev URL: `http://localhost:5173/` (`pnpm dev`)
- Production build: served from `dist/index.html` after `pnpm build`

The catch-all redirect is intentional — there is no dedicated 404 page yet.

## Gates

All commands run from the repo root on Windows 11 / PowerShell, `pnpm` 9.x.

| Gate | Command | Status | Notes |
|---|---|---|---|
| TypeScript | `pnpm check` | PASS | `tsc --noEmit` clean |
| Lint | `pnpm lint` | PASS | `eslint . --max-warnings=0` clean |
| Tests | `pnpm test` | PASS | 39 test files, 279 tests passed |
| Build | `pnpm build` | PASS | `vite build` clean |
| Rules umbrella | `pnpm rules:check` | PASS | 21/21 guards green |
| Arch umbrella | `pnpm arch:check:v2` | PASS | 9/9 architecture guards green |
| Domain boundaries | `pnpm guards:domains` | PASS | No cross-domain violations |
| Secret scan | `pnpm guards:secrets` | PASS | No secrets |
| Review index | `pnpm guards:review` | PASS | step-20 entry present |
| Self-audit evidence | `pnpm guards:self-audit` | PASS | Section present below |
| BRAMKA acceptance | `pnpm guards:bramka` | PASS | All points |
| All-local guards | `pnpm guards:all-local` | PASS | Umbrella of the above |
| Build-artifact scan | `node scripts/check-build-artifacts.mjs` | PASS | No removed-area chunks |

## PRE-COMMIT DECISION

- Changed files: 9 modified + 33 new (1 router, 20 auth, 11 onboarding, 1
  handoff doc, this report, index update) — see tables above
- Domains touched: none (app-v2 shell only)
- Cross-domain imports: none — new files import only relative paths within
  `app-v2/auth` / `app-v2/onboarding`, plus `react` and `react-router-dom`
- Legacy runtime imports: none
- Removed routes/nav/build chunks: none — no `/seller`, `/marketplace`,
  `/calendar`, `/notes`, `/habits`, `/tasks`, `/pages`, `/pasje`,
  `/fundraiser`, `/donations`, `/commerce`, `/productivity` anywhere
- Public DTO PII: none — no API calls, no DTOs; onboarding PII (name, birthday,
  phone) lives only in component `useState` and never leaves the client
- Media base64/dataUrl: none — avatar step holds no embedded data URL payload;
  grep for `base64` / `data:image` returns nothing
- List pagination/limit/cursor: N/A — no runtime lists
- Fake DONE/status truth: none — status is the honest
  `AUTH_REGISTER_ONBOARDING_SHELL_PR_READY`; no banned terms
- Env safety: no `.env` files touched, no secrets
- TypeScript: PASS
- V2 lint: PASS (`pnpm lint:v2` covered by `pnpm lint`)
- Tests: PASS (279/279)
- Build: PASS
- Commit decision: COMMIT_ALLOWED — all gates green, scope matches the handoff
  brief, no backend or domain touched

## SELF-AUDIT / INDEPENDENT REVIEW PASS

| # | Question | Answer |
|---|---|---|
| 1 | What I changed | Added `client/src/app-v2/AppRouter.tsx`, the `client/src/app-v2/auth/` folder (layout, brand panel, 4 routes, 4 form components + validators, 5 test files) and the `client/src/app-v2/onboarding/` folder (flow controller, progress, 5 steps, shared CSS, 1 test). Repointed landing CTAs in SiteHeader/HeroSection/FinalCtaSection from `href="#"` to `<Link>` routes. Switched `App.tsx` to render `<AppRouter />`. Added `react-router-dom@^7.15.1`. Added this report + index entry + handoff doc. |
| 2 | What I might have broken | Low risk. `App.tsx` previously rendered `<LandingPage />` directly; it now renders it via the router at `/`, and `App.test.tsx` was updated and passes. The landing test was wrapped in `<MemoryRouter>` because the sections now use `<Link>`. No guard, governance doc, or domain file was touched. |
| 3 | Domain boundaries affected | None. No code under `client/src/features-v2/` or `server/domains-v2/` was imported or modified. All new code is in the `app-v2` shell layer. |
| 4 | Cross-domain imports check | Verified by `pnpm guards:domains` (PASS) and by grepping every `import` in `auth/` and `onboarding/` — only relative intra-folder imports plus `react` / `react-router-dom` / test libs. |
| 5 | Legacy/runtime check | Verified by `check-no-legacy-imports.mjs` (PASS). No imports from `client/src/features/`, `client/src/pages/`, `server/domains/`, or any legacy path. Legacy code was consulted READ-ONLY for microcopy/patterns only. |
| 6 | Fake DONE/status truth check | Verified by `check-fake-done.mjs` (PASS) and by reading the report. No `DONE`/`CLEAN`/`COMPLETE`/`production-ready` claims. Status is `AUTH_REGISTER_ONBOARDING_SHELL_PR_READY`; sub-areas are `UI_SHELL_ONLY` / `MOCK_LOCAL_ONLY` / `BACKEND_NOT_STARTED`. |
| 7 | PII/base64/secrets check | Verified by `check-public-dto-pii.mjs`, `check-media-base64.mjs`, secret scanners, `check-env-safety.mjs` (all PASS). Onboarding PII (name, birthday, phone) is held only in `useState`, never serialized to an API or storage. Grep for `localStorage`/`sessionStorage`/`base64`/`data:image` returns nothing. |
| 8 | Routes/nav/build graph check | `dist/` rebuilt and scanned by `check-build-artifacts.mjs` (PASS) — no removed-area chunks. The new routes are additive; the catch-all redirects unknown paths to `/`. No removed product area re-added. |
| 9 | Guard weakening check | No guard script was modified — `git diff scripts/` is empty. No regex relaxed, no threshold changed, no allowlist extended. |
| 10 | Evidence reviewed | `docs/review/step-20-auth-register-onboarding-shell/STEP_20_REPORT.md` (this file); command outputs in the Gates table; `git status`, `git diff --stat`, and per-file greps reviewed before committing. |
| 11 | Gates run | `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm rules:check`, `pnpm arch:check:v2`, `pnpm guards:domains`, `pnpm guards:secrets`, `pnpm guards:review`, `pnpm guards:self-audit`, `pnpm guards:bramka`, `pnpm guards:all-local`, `node scripts/check-build-artifacts.mjs` — all exited 0. |
| 12 | Remaining risks | (a) No real authentication — login/register/reset are honest UI shells. (b) No onboarding persistence — a page refresh loses state. (c) No e2e / visual regression tests — only structural smoke tests. (d) No dedicated 404 page — the catch-all redirect to `/` is intentional. |

## Honest limitations

- No real login/auth — UI shell only, backend not started
- No onboarding persistence — refresh loses state (mock-local `useState`)
- No e2e / visual regression coverage
- No dedicated 404 page — catch-all `<Navigate to="/" replace />` is deliberate

## Blockers

None.

## Next step

- When the `identity` V2 domain reaches a usable state, wire the auth screens
  to real endpoints and replace the honest "not available yet" notices.
- Add onboarding persistence once an identity/profile backend exists.
- Consider e2e / visual regression tests once the routed surfaces stabilize.
