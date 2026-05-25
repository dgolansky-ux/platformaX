# Step 25 — Professional Profile Desktop/Tablet Adaptation

Generated: 2026-05-25

Status: `PROFESSIONAL_PROFILE_DESKTOP_ADAPTATION_PR_READY`

> Filename note: committed as `STEP_25_REPORT.md` (not `_REVIEW.md`) so the
> governance guards (`check-pre-commit-decision.mjs`, `check-self-audit-evidence.mjs`)
> actually validate the required sections — they only inspect `_REPORT.md` files.
> Matches the repo convention.

## Summary

Adapted the professional layer (step-24) of the personal profile to tablet and
desktop widths. Additive CSS only: mobile is the base/source of truth and
desktop/tablet are `@media` overrides. The professional view remains the second
**mode** of the same profile — not a separate route or domain. No mobile flow,
order, CTA, copy or state changed. No backend, no Supabase, no DB, no upload, no
migrations, no Railway.

## Status truth

- `UI_SHELL_ONLY`
- `MOCK_LOCAL_ONLY`
- `BACKEND_NOT_STARTED`
- `MANUAL_REVIEW_REQUIRED` — desktop/tablet visual parity not screenshot-verified
  (no browser in env).
- `SPECIALIZATIONS_DATA_PENDING` / `PROFESSIONS_DATA_PENDING` — the professional
  layer still renders empty states only (no fabricated data); desktop adapts those.

`IMPLEMENTED` / `VISUAL_DONE` are not claimed.

## Scope (UI) — professional layer desktop/tablet

- The shared shell desktop adaptation from step-23 (centered 920px page-card,
  desktop background, header/banner/portal cards desktop layout, tablet widening)
  already applies in professional mode — it is the same `.shell`.
- New in this step: a `professionalGrid` wrapper around the professional sections.
  - Mobile: `display: contents` (transparent — sections stack exactly as in
    step-24; zero mobile change).
  - Desktop (`min-width: 1024px`): two-column grid; `ProfessionBlock` spans the
    full width on top, then `ProfileSpecialists` + `ProfileProfessionalActivities`
    sit side by side. DOM order preserved (mobile + a11y reading order intact).
- Hover affordances (`@media (hover: hover)`) and `:focus-visible` outlines added
  for the professional controls (specialists visibility toggle, Klasyczny/Sieć
  tabs, "Dodaj" buttons, work-type sheet options).

## Professional profile is a layer of the personal profile

Confirmed (unchanged from step-24). `mode === "professional"` inside the same
`ProfilePage` at the same `/profile` route. No `professional-profile` route, no
`client/src/features-v2/professional-profile` domain (asserted by test). Switching
back to Osobisty restores the personal layer.

## Mobile-first confirmation

**Mobile-first not downgraded. No `MOBILE_DELTA`.** All professional mobile base
styles from step-24 are untouched; every change is an additive `@media`
(min-width / hover) rule plus a `display:contents` wrapper that is flow-transparent
on mobile. All step-22/23/24 mobile tests still pass.

## VISUAL_DELTA

- None for layout structure. The professional layer still shows empty states
  (no profession/specialization data — `*_DATA_PENDING`), so desktop adapts empty
  states; the populated profession card / specialists list / network graph desktop
  visuals will be validated once data exists. This is a data-driven limitation,
  not a layout deviation.

## What was carried from the blueprint

- Desktop adaptation principle (§3.4): media-query overrides that widen and use
  horizontal space; mobile flow unchanged.
- Desktop card hover lift (`translateY(-2px)` + stronger shadow) and the centered
  desktop page-card (inherited from step-23, applies to professional mode).
- Multi-column desktop arrangement of the professional sections (a faithful
  desktop adaptation of the mobile-first professional layer).

## What was deliberately NOT done

- No professional data / specialization taxonomy (data pending).
- No profession editor (§24), availability runtime (§9), or populated network
  graph (§23.6).
- No backend, Supabase, DB, upload (no base64/dataUrl), migrations, Railway.
- No separate `professional-profile` domain.
- No JS responsive logic (pure CSS keeps mobile safe).
- No live desktop screenshots (no browser in env) → MANUAL_REVIEW_REQUIRED.

## Architecture Impact Statement

Pure presentation change in the existing app-shell composition
`client/src/app-v2/profile/`: a `display:contents` wrapper in `ProfilePage.tsx`,
additive desktop/hover/focus CSS for the professional layer, and one desktop
structure test. No new dependency, no new route, no domain touched
(`features-v2/*`, `server/domains-v2/*`). Professional view stays a mode/state of
the same profile. No removed product area reintroduced.

## Legacy Containment

- Legacy runtime imports: PASS (none)
- Removed active routes/routers/chunks: PASS (none)
- Reference material used: YES — blueprint (read-only, distilled from `~/Desktop/Starykod-4`). No legacy code imported/copied.
- Exceptions: none

## Changed files

| Path | Action | Notes |
|---|---|---|
| `client/src/app-v2/profile/ProfilePage.tsx` | Modified | Wrap professional layer in a `display:contents` grid wrapper |
| `client/src/app-v2/profile/profile.module.css` | Modified | `.professionalGrid` + desktop 2-col grid + hover/focus for professional controls |
| `client/src/app-v2/profile/__tests__/ProfilePage.test.tsx` | Modified | +1 desktop professional grid-wrapper test |
| `docs/review/step-25-professional-profile-desktop-adaptation/STEP_25_REPORT.md` | Created | This report |
| `docs/review/REVIEW_REPORTS_INDEX.md` | Modified | Adds step-25 entry |

No files deleted. No guard scripts modified (`git diff scripts/` empty).

## Before-commit confirmations

- no legacy runtime imports
- no separate professional-profile domain
- no Supabase DB / coupling
- no Railway
- no migrations
- no fake DONE
- no public PII
- no base64/dataUrl
- no weakened guards
- mobile-first UX not downgraded (no MOBILE_DELTA)

## Gates

| Gate | Status |
|---|---|
| `pnpm check` / `lint` / `test` | PASS (311/311, 42 files) |
| `pnpm build` | PASS |
| `pnpm rules:check` | PASS (21/21) |
| `pnpm arch:check:v2` | PASS (9/9) |
| `guards:domains` / `secrets` / `review` / `self-audit` | PASS |
| `pnpm guards:bramka` | PASS (25/25) |
| `guards:all-local` + `check-build-artifacts` | PASS |

## PRE-COMMIT DECISION

- Changed files: 3 modified (ProfilePage, CSS, test) + 1 new report + index
- Domains touched: `app-v2/profile` (presentation only)
- Cross-domain imports: none
- Legacy runtime imports: none
- Removed routes/nav/build chunks: none
- Public DTO PII: none
- Media base64/dataUrl: none
- List pagination/limit/cursor: N/A
- Fake DONE/status truth: none — honest shell statuses + data-pending flags
- Env safety: no `.env`/secrets
- TypeScript: PASS
- V2 lint: PASS
- Tests: PASS (311/311)
- Build: PASS
- Commit decision: COMMIT_ALLOWED

## SELF-AUDIT / INDEPENDENT REVIEW PASS

| # | Question | Answer |
|---|---|---|
| 1 | What I changed | Added a `display:contents` wrapper around the professional layer; added desktop 2-col grid (ProfessionBlock full-width) + hover/focus CSS for professional controls; added one desktop structure test. Added this report + index entry. |
| 2 | What I might have broken | Very low risk. Mobile professional base CSS untouched; desktop rules are additive media queries; wrapper is `display:contents` on mobile. All prior mobile tests pass. |
| 3 | Domain boundaries affected | None. Presentation-only change in `app-v2/profile`. |
| 4 | Cross-domain imports check | `pnpm guards:domains` / `audit-domain-boundaries.mjs` PASS; source-scan test PASS. |
| 5 | Legacy/runtime check | `check-no-legacy-imports.mjs` PASS; source-scan test PASS. Blueprint read-only. |
| 6 | Fake DONE/status truth check | `check-fake-done.mjs` PASS. Honest statuses + data-pending flags. |
| 7 | PII/base64/secrets check | PII/base64/secret/env guards PASS. Render PII test passes; no upload. |
| 8 | Routes/nav/build graph check | `check-build-artifacts.mjs` + `check-removed-product-areas.mjs` PASS. No route added; professional stays a mode. |
| 9 | Guard weakening check | No guard modified — `git diff scripts/` empty. Tests additive. |
| 10 | Evidence reviewed | This report; Gates table; `git status`/`git diff --stat`; re-read of the CSS + wrapper. |
| 11 | Gates run | check, lint, test, build, rules:check, arch:check:v2, guards:domains, guards:secrets, guards:review, guards:self-audit, guards:bramka, guards:all-local, check-build-artifacts. |
| 12 | Remaining risks | (a) Desktop/tablet visual parity not screenshot-verified → MANUAL_REVIEW_REQUIRED. (b) Empty-state-only until profession data exists. (c) `display:contents` very wide but not 100% legacy-browser support; graceful fallback (sections stack). |

## Honest limitations

- No live desktop/tablet screenshots (no Chrome/browser in env) →
  `MANUAL_REVIEW_REQUIRED`.
- Professional layer is empty-states-only (data pending); populated desktop
  visuals validated once profession data + editor exist.
- Mock-local; no persistence.

## Blockers

None.

## Next step

- Capture tablet + desktop screenshots; manual visual parity review.
- Profession reference data + editor; availability; populated network view.
