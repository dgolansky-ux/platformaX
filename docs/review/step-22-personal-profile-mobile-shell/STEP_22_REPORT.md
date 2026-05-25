# Step 22 — Personal Profile Mobile Shell

Generated: 2026-05-25

Status: `PERSONAL_PROFILE_MOBILE_SHELL_PR_READY`

> Filename note: the task brief named this `STEP_22_REVIEW.md`. It is committed as
> `STEP_22_REPORT.md` so the governance guards (`check-pre-commit-decision.mjs`,
> `check-self-audit-evidence.mjs`) actually validate its required sections — they
> only inspect files ending in `_REPORT.md`. Matches the repo convention.

## Summary

First clean V2 personal-profile shell, mobile-first, built from
`docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST.md` (blueprint = source of truth).
Personal layer only. No professional layer, no friends-feed full page, no
backend, no Supabase, no avatar upload, no migrations.

Route `/profile` added to the V2 app router. The screen is composed from small
sections under `client/src/app-v2/profile/` with mock-local fixtures.

## Status truth

- `UI_SHELL_ONLY`
- `MOCK_LOCAL_ONLY`
- `BACKEND_NOT_STARTED`
- `MANUAL_REVIEW_REQUIRED` — visual parity vs legacy mobile is not verified with
  screenshots in this change (see Honest limitations). `IMPLEMENTED` /
  `VISUAL_DONE` are **not** claimed.

## Scope (UI)

Built per blueprint §35 Step P2 (personal profile mobile shell):

- Mobile top bar (brand + back link + disabled "edit profile" policy CTA).
- ProfileHeader in the fixed blueprint order (§6.1):
  name → [avatar | separator | bio "O mnie"] → status bar → mode switcher → banner.
- Avatar with gradient + fallback initial (no upload), owner eye/preview button.
- Bio preview (6-line clamp) with owner empty placeholder "Dodaj opis...".
- Status bar: status pill (filled + empty "Ustaw swój status...") and a
  disabled status-photo button (media runtime not connected — no upload).
- Mode switcher `Osobisty / Zawodowy`: personal active; **Zawodowy disabled**
  (professional layer is a later PR, not a separate route/domain). Swipe hint
  kept; gesture is `GESTURE_PENDING`.
- Empty gradient banner + working share action (Web Share / clipboard, guarded).
- Social links (rendered only when present), blueprint colors.
- Owner preview menu (Widok znajomego / nieznajomego / Zamknij) → preview banner.
- Three portal cards in fixed order (Społeczności, Kanały, Feed znajomych) as
  disabled-policy CTAs (target domains/routes not built yet).
- Contacts carousel shell with category tabs (Wszyscy/Bliscy/Rodzina bliska/
  dalsza) filtering via local state + empty state.
- QuickFeedPreview shell: "Ostatnie posty" expand/collapse via local state
  (no `localStorage`) + empty state.
- Personal content sections "Prezentacja profilu" and "Ważne wydarzenia" with
  empty states (no posts/milestone runtime in this shell).

Not built (deliberately out of scope): professional layer, profession editor,
friends-feed full page, posts/timeline runtime, avatar/banner upload, status
modals, public profile of other users.

## Mobile-first decisions

- Single-column mobile layout is the source of truth; desktop is a light
  responsive adaptation only (`@media (min-width: 768px)` widens the max content
  width, does not change the mobile flow) — per blueprint §3.4.
- Small mobile typography preserved (12–22px), white-blue professional palette
  consistent with the landing page and blueprint brand tokens.
- Header order and section order follow the blueprint exactly.

## What was carried from the blueprint

- Section order (§4) and header order (§6.1).
- Microcopy: "O mnie", "Dodaj opis...", "Osobisty/Zawodowy", swipe hint,
  "Społeczności/Kanały/Feed znajomych", "Kontakty", "Ostatnie posty",
  "Prezentacja profilu", "Ważne wydarzenia", empty-state copy, preview banners.
- Visual tokens: avatar gradient/shadow, separator gradient, switcher styling,
  banner gradient + share, portal card layout, contacts carousel sizes.
- `pasje`/`passions` deliberately NOT reintroduced (blueprint §34.1). Preview
  banner copy uses the neutral legacy variant ("feed, status i aktywności" /
  "publiczne informacje i zawody"), no passions domain.

## What was deliberately NOT done

- No professional layer / profession editor (later PR).
- No friends-feed full page.
- No posts/milestone/contacts runtime — mock fixtures only.
- No avatar/banner/status-photo upload (no base64/dataUrl; media not connected).
- No backend, no Supabase, no DB, no migrations, no Railway.
- No `localStorage`/`sessionStorage` as fake backend.
- No live visual/screenshot verification (Chrome unavailable in this env).

## Architecture Impact Statement

New code lives entirely in the app-shell composition layer
`client/src/app-v2/profile/`, consistent with `app-v2/landing|auth|onboarding`.
It composes a personal profile screen from small sections + typed local
fixtures. No feature-domain runtime (`client/src/features-v2/*`,
`server/domains-v2/*`) is imported or modified. No new dependency. No
`professional-profile` domain is created — the professional view is modeled as a
(currently disabled) mode of the same profile, per blueprint §5/§38. One route
added (`/profile`); no removed product area reintroduced.

## Legacy Containment

- Legacy runtime imports: PASS (none)
- Removed active routes: PASS (none)
- Removed active backend routers: PASS (none)
- Removed active chunks: PASS (none)
- Reference material used: YES — blueprint `docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST.md`
  (distilled from `~/Desktop/Starykod-4`, read-only). No legacy code imported/copied.
- Any exceptions: none

## Changed files

### New — profile shell

| Path | Notes |
|---|---|
| `client/src/app-v2/profile/types.ts` | View models (no private PII in shapes) |
| `client/src/app-v2/profile/fixtures.ts` | Typed mock owner profile (no PII) |
| `client/src/app-v2/profile/profile.module.css` | Shared mobile-first styles + tokens |
| `client/src/app-v2/profile/ProfilePage.tsx` | Route orchestrator + local state |
| `client/src/app-v2/profile/sections/ProfileHeader.tsx` | Header order composition |
| `client/src/app-v2/profile/sections/ProfileAvatar.tsx` | Avatar + eye/preview |
| `client/src/app-v2/profile/sections/ProfileBio.tsx` | "O mnie" bio preview |
| `client/src/app-v2/profile/sections/ProfileStatusBar.tsx` | Status pill + disabled photo |
| `client/src/app-v2/profile/sections/ProfileModeSwitcher.tsx` | Osobisty/Zawodowy (Zawodowy disabled) |
| `client/src/app-v2/profile/sections/ProfileBanner.tsx` | Banner + share |
| `client/src/app-v2/profile/sections/ProfileSocialLinks.tsx` | Social link squares |
| `client/src/app-v2/profile/sections/ProfilePortalCards.tsx` | 3 portal cards (disabled-policy) |
| `client/src/app-v2/profile/sections/ProfileContacts.tsx` | Contacts carousel + tabs |
| `client/src/app-v2/profile/sections/ProfileQuickFeed.tsx` | Quick feed expand shell |
| `client/src/app-v2/profile/sections/ProfilePersonalSections.tsx` | Posts + milestones empty states |
| `client/src/app-v2/profile/__tests__/ProfilePage.test.tsx` | Render + CTA + boundary + PII tests |

### New — docs

| Path | Notes |
|---|---|
| `docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST.md` | Blueprint source of truth (now tracked) |
| `docs/review/step-22-personal-profile-mobile-shell/STEP_22_REPORT.md` | This report |

### Modified

| Path | Notes |
|---|---|
| `client/src/app-v2/AppRouter.tsx` | Adds `/profile` route |
| `docs/review/REVIEW_REPORTS_INDEX.md` | Adds step-22 entry |

## Before-commit areas touched

- `app-v2/profile` (new), `app-v2` router (one route added).
- Docs: blueprint + review report + index.
- No backend, no feature-v2 domains, no guards.

Confirmations:

- no legacy runtime imports
- no Supabase DB / no Supabase coupling in components
- no Railway
- no migrations
- no fake DONE
- no public PII (no phone/dateOfBirth/private email in view models or render)
- no base64/dataUrl (no upload)
- no weakened guards (`git diff scripts/` empty)

## Gates

| Gate | Command | Status |
|---|---|---|
| TypeScript | `pnpm check` | PASS |
| Lint | `pnpm lint` | PASS |
| Tests | `pnpm test` | PASS (306/306, 42 files) |
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

## PRE-COMMIT DECISION

- Changed files: 16 new (shell) + 2 new docs + 2 modified (router, index)
- Domains touched: `app-v2/profile` (app-shell composition only)
- Cross-domain imports: none — profile imports its own sections + react/react-router-dom
- Legacy runtime imports: none
- Removed routes/nav/build chunks: none — no `/marketplace`, `/seller`, `/passions`, etc.
- Public DTO PII: none — view models exclude phone/dateOfBirth/private email by design
- Media base64/dataUrl: none — no upload; avatar/banner are gradients/initials
- List pagination/limit/cursor: N/A — mock fixtures rendered via `.map`, no runtime list API
- Fake DONE/status truth: none — `UI_SHELL_ONLY` / `MOCK_LOCAL_ONLY` / `MANUAL_REVIEW_REQUIRED`
- Env safety: no `.env` changes, no secrets
- TypeScript: PASS
- V2 lint: PASS
- Tests: PASS (306/306)
- Build: PASS
- Commit decision: COMMIT_ALLOWED

## SELF-AUDIT / INDEPENDENT REVIEW PASS

| # | Question | Answer |
|---|---|---|
| 1 | What I changed | Added `client/src/app-v2/profile/` (orchestrator + 10 sections + types + fixtures + shared CSS + tests), added `/profile` route, committed the blueprint doc, added this report + index entry. |
| 2 | What I might have broken | Low risk. Additive: a new route + new folder. AppRouter change is one import + one `<Route>`. No existing screen, guard, or domain touched. Existing tests untouched and passing. |
| 3 | Domain boundaries affected | None. Profile is app-shell composition; imports only its own modules + react/react-router-dom. No `features-v2/*` or `domains-v2/*` import. |
| 4 | Cross-domain imports check | Verified by `pnpm guards:domains` / `audit-domain-boundaries.mjs` (PASS) and by the ProfilePage source-scan test. |
| 5 | Legacy/runtime check | `check-no-legacy-imports.mjs` PASS + source-scan test asserts no `features/|pages/|components/` imports and no SDK. Blueprint used read-only; no legacy code imported. |
| 6 | Fake DONE/status truth check | `check-fake-done.mjs` PASS. Status is the honest shell set; no banned terms. |
| 7 | PII/base64/secrets check | `check-public-dto-pii.mjs`, `check-media-base64.mjs`, secret scanners, `check-env-safety.mjs` PASS. A render test asserts no phone/dateOfBirth/email/`input[type=tel]` in output. No base64/dataUrl; no upload. |
| 8 | Routes/nav/build graph check | `check-build-artifacts.mjs` + `check-removed-product-areas.mjs` PASS. Only `/profile` added; no removed area reintroduced; portal CTAs are disabled-policy, not fake routes. |
| 9 | Guard weakening check | No guard modified — `git diff scripts/` empty. New tests are additive. |
| 10 | Evidence reviewed | This report; Gates table; `git status`/`git diff --stat`; per-file reads of the sections. |
| 11 | Gates run | check, lint, test, build, rules:check, arch:check:v2, guards:domains, guards:secrets, guards:review, guards:self-audit, guards:bramka, guards:all-local, check-build-artifacts. |
| 12 | Remaining risks | (a) Visual parity vs legacy mobile not screenshot-verified (Chrome unavailable) → `MANUAL_REVIEW_REQUIRED`. (b) Professional layer, posts/timeline runtime, upload, and gestures are pending later PRs. (c) Many CTAs are disabled-policy until their domains exist. |

## Honest limitations

- Visual parity with legacy mobile is NOT verified by screenshots in this change
  (no Chrome in the environment to run the dev server through a browser). Status
  stays `MANUAL_REVIEW_REQUIRED` for visual review.
- Mock-local only: no real profile data, no persistence.
- Professional layer, profession editor, posts/timeline runtime, friends-feed
  full page, avatar/banner upload, status modals, and swipe gestures are out of
  scope (pending later PRs).
- Several CTAs are intentionally disabled-policy (Społeczności/Kanały/Feed,
  edit profile, status photo, add post/milestone) until their domains exist.

## Blockers

None.

## Next step

- Capture mobile screenshots and run visual parity review against legacy.
- Step P3: personal content runtime (posts/timeline) once content backend exists.
- Step P4+: professional layer as a mode of the same identity profile.
