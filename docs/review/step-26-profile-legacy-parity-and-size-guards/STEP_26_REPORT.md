# Step 26 — Profile Legacy Parity + Size Guards

Generated: 2026-05-25

Status: `PROFILE_LEGACY_PARITY_AND_SIZE_GUARDS_PR_READY`

> Filename note: committed as `STEP_26_REPORT.md` (not `_REVIEW.md`) so the
> governance guards (`check-pre-commit-decision.mjs`, `check-self-audit-evidence.mjs`)
> validate the required sections — they only inspect `_REPORT.md` files.

## Summary

A four-part UI-shell parity pass on top of step-22..25:

- **A.** A new `scripts/check-file-size-limits.mjs` guard caps CSS modules at
  360 lines and global CSS at 500. Wired into `pnpm rules:check`. The
  998-line `profile.module.css` was split into seven focused modules under
  `client/src/app-v2/profile/styles/`, every file < 360 lines.
- **B.** Audit of the legacy profile/professional/quick-feed/nav components
  against V2 — see `PROFILE_PARITY_AUDIT.md` (same directory).
- **C.** Quick feed preview tightened to 1:1 against legacy `QuickFeedPreview`:
  full-bleed toggle, stacked author avatars, LIVE pulse, skeleton shimmer,
  local post-detail sheet (visual shell, no feed runtime).
- **D.** Floating navigation already shipped in pre-step (glassmorphism pill,
  central Home + Profil island, scroll hide/show, bounce entry, `prefers-reduced-motion`).
  This step adds dedicated test coverage and removes a guard-tripping comment.
- **E.** Profile polish to 1:1 with legacy: 144 px avatar with gradient ring,
  animated header separator, status pill bg/border variants + ph-* animations,
  67×67 status photo, 200 px mode-switcher pill with scale-1.02 active,
  per-card portal accents + radial gradient + online dot + "wkrótce" label,
  contacts header (icon + Sora title + search pill) + per-tab color scheme,
  full-bleed carousel, orange specialists header + 40×22 switch, professional
  "Moja praca" + "Moduł w budowie" warning, 48 px social-link tiles.
- **F.** `client/src/app-v2/README.md` updated for current state (Supabase
  Auth adapter, `/check-email` without email param, profile + nav surfaces,
  split CSS modules).

No backend, no Supabase DB, no migrations, no Railway, no upload runtime, no
feed runtime, no profile persistence, no separate `professional-profile` domain.

## Status truth

- `UI_SHELL_ONLY`
- `MOCK_LOCAL_ONLY`
- `BACKEND_NOT_STARTED`
- `MANUAL_REVIEW_REQUIRED` — visual parity not screenshot-verified (no browser
  in env). User confirms by running `pnpm dev` and comparing `/profile`
  against `~/Desktop/Starykod-4-readonly/PlatformaX`.
- `SPECIALIZATIONS_DATA_PENDING` / `PROFESSIONS_DATA_PENDING` — professional
  layer renders empty states only (no fabricated data).

`IMPLEMENTED` / `VISUAL_DONE` / `FULL_DONE` are not claimed.

## Scope

| Part | Where | What |
|---|---|---|
| A — file-size guard | `scripts/check-file-size-limits.mjs`, `scripts/rules-check.mjs` | New guard for `.module.css` (360) + `.css` (500), wired to `pnpm rules:check` |
| A — CSS split | `client/src/app-v2/profile/styles/` | 998-line `profile.module.css` → 7 modules, max 350 lines |
| B — audit | `docs/review/step-26.../PROFILE_PARITY_AUDIT.md` | Legacy files reviewed, deltas, VISUAL_DELTA list |
| C — quick feed 1:1 | `sections/ProfileQuickFeed.tsx`, `styles/profile-feed-preview.module.css` | Full-bleed wrapper + toggle `calc(100% - 32px)`, LIVE pulse, skeleton, local detail sheet |
| D — floating nav 1:1 | `client/src/app-v2/navigation/` (+ new test) | Already shipped — added `FloatingNav.test.tsx` and a no-legacy-imports source scan |
| E — polish 1:1 | `client/src/app-v2/profile/sections/`, all `profile/styles/*.module.css` | Avatar, separator, status pill+photo, switcher, portal cards, contacts, specialists, activities, social, banner |
| F — README | `client/src/app-v2/README.md` | Auth Supabase adapter, `/check-email` (no email param), profile + nav + CSS-split note |

## File-size guard decision (size taxonomy)

The task brief proposed `*.tsx` 220 / route 280 / `.test.*` 320 / scripts 300
limits. **Not adopted.** Reason:

1. Coding standards §6 (which wins over the task brief per active-rules §1)
   already defines component 250 soft / 350 hard, scripts 350 soft / 500 hard.
   The proposed numbers conflict with the active standard.
2. Adopting them would break existing compliant files (e.g.
   `OnboardingFlow.tsx` 313 > 220, several test files > 320), forcing either
   weakening or churn refactors.
3. The actual gap was CSS — `profile.module.css` was 998 lines and not gated.

Therefore: **CSS-only gap closed** with the new guard; tsx/ts/scripts stay
under the existing `check-file-complexity.mjs` thresholds. Documented in this
report so the deviation is explicit and reviewable.

## CSS split summary

| File | Lines | Imported by |
|---|---:|---|
| `profile-layout.module.css` | 155 | `ProfilePage` |
| `profile-header.module.css` | **350** | `ProfileHeader`, `ProfileAvatar`, `ProfileBio`, `ProfileBanner`, `ProfileSocialLinks`, `ProfilePage` (preview) |
| `profile-status.module.css` | 253 | `ProfileStatusBar`, `ProfileModeSwitcher` |
| `profile-sections.module.css` | 295 | `ProfileContacts`, `ProfilePersonalSections`, and (shared atoms) all professional-layer components |
| `profile-portal.module.css` | 171 | `ProfilePortalCards` |
| `profile-professional.module.css` | 308 | `ProfessionBlock`, `ProfileSpecialists`, `ProfileProfessionalActivities` |
| `profile-feed-preview.module.css` | 255 | `ProfileQuickFeed` |

All ≤ 360 (limit). The original `client/src/app-v2/profile/profile.module.css`
(998 lines) is removed.

## Mobile-first decisions

- All sizes (avatar 144, status pill 260, status photo 67, friend card 67/61,
  social 48) are read from legacy mobile, not invented from desktop.
- Desktop (`@media (min-width: 1024px)`) only widens padding/grids — mobile
  flow and order are never altered. No `MOBILE_DELTA`.
- Animations (separator drop+pulse, status dot, sparkle, photo idle, online
  pulse, portal slide-in) all gated by `@media (prefers-reduced-motion: reduce)`.

## Mobile-first confirmation

Mobile-first NOT downgraded. No `MOBILE_DELTA`.

## VISUAL_DELTA

13 known deltas — see `PROFILE_PARITY_AUDIT.md` §4. None block the
visual-shell goal; all have explicit reasons (runtime not connected,
"pasje"/legacy product area removed, base64 upload forbidden, etc.).

## What was carried from the blueprint

- Header order (§6.1): name → avatar+bio row → status pill → mode switcher → banner.
- Avatar (§6.4): 144×144, white outer pad, gradient ring (#0F3CC9 → #6366F1), inner #EFF6FF, 42 px Sora bold initial.
- Status pill (§8.2/§8.3) and 67×67 photo (§8.4) with ph-* animations.
- Mode switcher (§10.2): 28 px-radius pill, flex-1 buttons, active 1.02 scale + primary shadow.
- Portal cards (§13): per-card accent (#3B82F6 / #8B5CF6 / #EE1D52), tinted icon, slide-in stagger 0/80/160 ms.
- Contacts (§14): per-tab colors, edge-fade carousel, friend card 67/61 with online dot.
- Quick feed preview (§15): full-bleed toggle, stacked avatars, LIVE pulse, skeleton, post detail sheet.
- Professional empty states (§21–§23): empty profession card, orange specialists, "Moja praca" + "Moduł w budowie".
- Animations catalog (§32): ptr-slideIn, px-divider-drop, px-divider-pulse, ph-dot, ph-sparkle, status-photo-idle, pxOnlinePulse, qfp-* preserved.

## What was deliberately NOT done

- No bio editor (typewriter / 6×24 grid) — needs identity write runtime.
- No availability dropdown (professional STATUS_CONFIG) — needs identity mutation.
- No banner image / Ken Burns / parallax — needs media domain.
- No status photo upload — base64/dataUrl forbidden; media domain pending.
- No friends-carousel auto-marquee — engine ported as visual-only.
- No global `StatusTicker` — runtime-dependent (statuses query).
- No global floating-nav app-shell mount — only `/profile` for now.
- No Lucide icons — adding a runtime dep is out of scope for a CSS pass.
- No backend, no Supabase DB, no migrations, no Railway, no separate `professional-profile` domain.
- No screenshots (no browser in env).

## Architecture Impact Statement

Presentation-only change in `client/src/app-v2/profile` and `client/src/app-v2/navigation`,
plus a new generic governance guard (`check-file-size-limits.mjs`) and its
unit test. No new dependency, no new route, no domain touched. The
professional profile remains a `mode` of `ProfilePage` — no `professional-profile`
domain anywhere. No backend domain, repository, service, router, mapper or
policy modified. No public DTO added/changed. No DB migration. No build chunk
added. No removed product area reintroduced.

## Legacy Containment

- Legacy runtime imports: PASS (none — scanned by `check-no-legacy-imports.mjs` + per-component source-scan tests)
- Removed active routes/routers/chunks: PASS (none)
- Reference material used: YES — `~/Desktop/Starykod-4-readonly` (read-only) and `docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST.md` (distilled). No legacy code imported/copied.
- Exceptions: none

## Changed files

### New
- `scripts/check-file-size-limits.mjs` — CSS file-size guard (HAND003 part A; was already on disk pre-handoff).
- `scripts/__tests__/file-size-limits.test.ts` — guard unit test (PASS at-limit, FAIL above limit, ALLOW marker).
- `client/src/app-v2/profile/styles/profile-layout.module.css`
- `client/src/app-v2/profile/styles/profile-header.module.css`
- `client/src/app-v2/profile/styles/profile-status.module.css`
- `client/src/app-v2/profile/styles/profile-sections.module.css`
- `client/src/app-v2/profile/styles/profile-portal.module.css`
- `client/src/app-v2/profile/styles/profile-professional.module.css`
- `client/src/app-v2/profile/styles/profile-feed-preview.module.css`
- `client/src/app-v2/navigation/FloatingNav.tsx`
- `client/src/app-v2/navigation/useScrollHide.ts`
- `client/src/app-v2/navigation/floating-nav.module.css`
- `client/src/app-v2/navigation/__tests__/FloatingNav.test.tsx`
- `docs/handoff/HAND003.md`
- `docs/review/step-26-profile-legacy-parity-and-size-guards/PROFILE_PARITY_AUDIT.md`
- `docs/review/step-26-profile-legacy-parity-and-size-guards/STEP_26_REPORT.md`

### Modified
- `client/src/app-v2/README.md` — current state (Supabase Auth adapter, profile + nav surfaces, CSS-split note).
- `client/src/app-v2/profile/ProfilePage.tsx` — wired the split CSS modules + ProfileProfessionalLayer + FloatingNav.
- `client/src/app-v2/profile/sections/*.tsx` — every section updated for the new split CSS modules and the 1:1 legacy markup (avatar wrap, status pill, mode switcher 200 px, portal cards with accent CSS vars, contacts header, etc.).
- `client/src/app-v2/profile/__tests__/ProfilePage.test.tsx` — added tests for quick-feed sheet, undefined-classname safety, specialists toggle, "Moja praca" disabled + "Moduł w budowie", floating-nav active state.
- `scripts/rules-check.mjs` — `check-file-size-limits.mjs` registered (was already on disk pre-handoff).

### Deleted
- `client/src/app-v2/profile/profile.module.css` — 998 lines, replaced by the 7-module split.

No `guards/*` scripts weakened. `git diff scripts/` shows only the additive registration of the new guard + the new guard file itself.

## Before-commit confirmations

- no legacy runtime imports
- no separate professional-profile domain
- no Supabase DB / coupling from V2 components
- no Railway
- no migrations
- no fake DONE
- no public PII
- no base64 / dataUrl / FileReader / readAsDataURL
- no weakened guards (additive guard + additive registration)
- mobile-first UX not downgraded (no `MOBILE_DELTA`)

## Gates

| Gate | Status |
|---|---|
| `pnpm check` (tsc) | PASS |
| `pnpm lint` (eslint --max-warnings=0) | PASS |
| `pnpm test` | PASS (327/327, 44 files) |
| `pnpm build` | PASS (see Gates section below) |
| `pnpm rules:check` | PASS (now includes `check-file-size-limits`) |
| `pnpm arch:check:v2` | PASS |
| `pnpm guards:domains` / `guards:secrets` / `guards:review` / `guards:self-audit` | PASS |
| `pnpm guards:bramka` | PASS (25/25 maintained) |
| `pnpm guards:all-local` | PASS |
| `node scripts/check-build-artifacts.mjs` | PASS |

## PRE-COMMIT DECISION

- Changed files: see above (1 deleted, 7 CSS modules created, 11 components/tests/docs modified, 1 guard + 1 guard test created, 3 navigation files created with test, 3 docs created).
- Domains touched: `app-v2/profile`, `app-v2/navigation`, `scripts/`, `docs/`.
- Cross-domain imports: none.
- Legacy runtime imports: none.
- Removed routes/nav/build chunks: none.
- Public DTO PII: none (no DTO touched; profile shell holds no PII).
- Media base64/dataUrl: none (status photo upload disabled-policy).
- List pagination/limit/cursor: N/A (no runtime lists).
- Fake DONE/status truth: none — honest `UI_SHELL_ONLY` / `MOCK_LOCAL_ONLY` / `BACKEND_NOT_STARTED` / `MANUAL_REVIEW_REQUIRED` / `*_DATA_PENDING` labels.
- Env safety: no `.env`/secrets touched.
- TypeScript: PASS.
- V2 lint: PASS.
- Tests: PASS (327/327).
- Build: PASS.
- Commit decision: COMMIT_ALLOWED.

## SELF-AUDIT / INDEPENDENT REVIEW PASS

| # | Question | Answer |
|---|---|---|
| 1 | What I changed | Split 998-line `profile.module.css` into 7 focused modules under `profile/styles/`. Updated every profile section component to use the split modules and to match legacy 1:1 (avatar 144 + gradient ring, separator anim, status pill+photo, 200 px mode switcher, portal cards with accent CSS vars + radial gradient + online dot, contacts header with icon + search pill + per-tab colors, full-bleed carousel, orange specialists + 40×22 switch, "Moja praca" + "Moduł w budowie" warning, 48 px social tiles). Added `FloatingNav.test.tsx`. Added `scripts/__tests__/file-size-limits.test.ts`. Rewrote `client/src/app-v2/README.md`. Authored `PROFILE_PARITY_AUDIT.md` + `STEP_26_REPORT.md`. Updated `REVIEW_REPORTS_INDEX.md`. |
| 2 | What I might have broken | Low risk. Existing 311 tests still pass (327/327 with the new ones). Risks: (a) `color-mix()` falls back gracefully where unsupported; (b) one comment in `FloatingNav.tsx` triggered the source-scan test (`tRPC`); reworded — confirmed by green run. |
| 3 | Domain boundaries affected | None. Presentation in `app-v2/profile`, app-shell UI in `app-v2/navigation`, a scripts guard, docs. |
| 4 | Cross-domain imports check | `pnpm guards:domains` / `audit-domain-boundaries.mjs` PASS. Per-component source scans assert no `@supabase/supabase-js`, no `features/*`, no `pages/*`, no `components/*`, no `trpc`, no `wouter`. |
| 5 | Legacy/runtime check | `check-no-legacy-imports.mjs` PASS. Source scans in profile + navigation tests PASS. Blueprint and `~/Desktop/Starykod-4-readonly` are read-only references. |
| 6 | Fake DONE/status truth check | `check-fake-done.mjs` PASS. Honest labels everywhere; no DONE/final/clean without evidence. |
| 7 | PII/base64/secrets check | PII + base64 + secret + env guards PASS. Render-time PII test passes. Status photo upload is a disabled-policy button. |
| 8 | Routes/nav/build graph check | `check-build-artifacts.mjs` + `check-removed-product-areas.mjs` PASS. No route added. Professional remains a `mode`. Floating nav still mounted only on `/profile`. |
| 9 | Guard weakening check | No guard softened. `scripts/rules-check.mjs` only gained an additive entry. `scripts/check-file-size-limits.mjs` is a new fail-closed guard with its own unit test. Bramka kept at 25/25 (verified). |
| 10 | Evidence reviewed | This report, the audit, gate logs, `git status`/`git diff --stat`, re-read of every changed file, line-count check (`wc -l` on every `*.module.css`). |
| 11 | Gates run | check, lint, test, build, rules:check, arch:check:v2, guards:domains, guards:secrets, guards:review, guards:self-audit, guards:bramka, guards:all-local, check-build-artifacts. |
| 12 | Remaining risks | (a) Visual parity not screenshot-verified → `MANUAL_REVIEW_REQUIRED`. (b) Professional layer remains empty-state-only (data pending). (c) `color-mix()` is a modern CSS feature — graceful fallback (icons keep default color) on older browsers. (d) Floating nav mounted only on `/profile` — global app-shell mount is a follow-up. |

## Honest limitations

- No live screenshots (no Chrome/browser in env) → `MANUAL_REVIEW_REQUIRED`.
- Profession reference data + editor pending; professional layer = empty states.
- Bio edit, banner image, status photo upload, availability dropdown, public preview not in scope.
- Floating nav scope: `/profile` only.

## Blockers

None.

## Next step

- Manual visual parity review against legacy on mobile width (user runs `pnpm dev`).
- Profession reference data + editor (a future step).
- Global app-shell mount of `FloatingNav` once more V2 routes exist.
- Media domain: presigned upload to unlock avatar/banner/status photo runtime.
