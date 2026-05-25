# Step 24 — Professional Profile Mobile Layer

Generated: 2026-05-25

Status: `PROFESSIONAL_PROFILE_MOBILE_LAYER_PR_READY`

> Filename note: committed as `STEP_24_REPORT.md` (not `_REVIEW.md`) so the
> governance guards (`check-pre-commit-decision.mjs`, `check-self-audit-evidence.mjs`)
> actually validate the required sections — they only inspect `_REPORT.md` files.
> Matches the repo convention (step-11 … step-23).

## Summary

Added the professional layer of the personal profile as a **mobile UI shell**.
The professional view is the second mode of the SAME profile (mode switch), not a
separate route or domain. The `Zawodowy` toggle (previously a disabled-policy
placeholder) is now a real local-state mode switch; switching shows the
professional sections in place of the personal content sections.

No backend, no Supabase, no DB writes, no media upload, no migrations, no Railway.
No `professional-profile` domain. No invented profession/specialization data.

## Status truth

- `UI_SHELL_ONLY`
- `MOCK_LOCAL_ONLY`
- `BACKEND_NOT_STARTED`
- `MANUAL_REVIEW_REQUIRED` — visual parity vs legacy mobile not screenshot-verified.
- `SPECIALIZATIONS_DATA_PENDING` and `PROFESSIONS_DATA_PENDING` — no profession or
  specialization reference data exists, so the layer renders blueprint empty
  states only (no fabricated professions/specializations).

`IMPLEMENTED` / `VISUAL_DONE` are not claimed.

## Scope (UI) — professional layer, mobile

Built from blueprint §10 (mode switch) and §21–23 (professional sections):

- Mode switch `Osobisty / Zawodowy` is now real local view state (both are modes
  of the same profile). Swipe gesture remains `GESTURE_PENDING` (hint + buttons).
- In professional mode the personal content sections (contacts, quick feed,
  posts, milestones) are hidden; the shared header, social links and portal cards
  stay.
- `ProfessionBlock` (§21.2): empty "Dodaj zawód" card (no profession data),
  "Dodaj" is a disabled-policy CTA (profession editor is a later PR).
- `ProfileSpecialists` (§22): empty state; owner visibility toggle
  (Widoczne / Ukryte) is real local state.
- `ProfileProfessionalActivities` (§23): `Klasyczny / Sieć` tabs (local state);
  both show blueprint empty states; the "Dodaj działanie zawodowe" CTA opens a
  local "Co chcesz dodać?" sheet listing the five blueprint work types
  (Stanowisko/Organizacja/Projekt/Usługa/Produkt) as disabled-policy options
  (their editor routes do not exist yet).

## Professional profile is a layer of the personal profile

Confirmed. The professional view is `mode === "professional"` inside the same
`ProfilePage` at the same `/profile` route. There is no `professional-profile`
route and no `client/src/features-v2/professional-profile` domain (asserted by
test). The personal layer is unchanged and re-appears on switching back.

## Mobile-first confirmation

**Mobile-first not downgraded. No `MOBILE_DELTA`.** The professional layer is new
mobile-first UI; the personal layer's existing mobile structure, order, copy and
states are unchanged (all step-22/23 mobile tests still pass). The only edits to
existing files enable the mode switch and branch the rendered sections by mode.

## VISUAL_DELTA

- The filled `ProfessionBlock` (active profession card with specialization tags,
  §21.3–21.4), `ProfileSpecialists` populated list, `ProfileProfessionalSection`
  network graph (§23.6) and availability status (§9) are not rendered with data
  in this shell because no profession/specialization data exists
  (`PROFESSIONS_DATA_PENDING` / `SPECIALIZATIONS_DATA_PENDING`). Only the empty
  states are shown. This is a deliberate data-driven delta, not a layout change.

## What was carried from the blueprint

- Mode switch semantics and labels (§10): Osobisty / Zawodowy, swipe hint.
- Empty professional states + copy: "Dodaj zawód", "Uzupełnij profil zawodowy
  aby być znajdowanym", "Specjaliści" + "0 osób" + "Nie dodano jeszcze żadnych
  specjalistów", "Klasyczny/Sieć", "Brak działań zawodowych", "Dodaj działania
  aby zobaczyć widok sieci", "Co chcesz dodać?" + work types (§23.3).
- Owner visibility toggle for specialists (§22.2).
- `passions/pasje` and `hobby` deliberately NOT introduced (blueprint §23.5/§34.1).

## What was deliberately NOT done

- No filled profession data / specialization taxonomy (data pending).
- No profession editor flow (§24) — later PR.
- No availability status runtime (§9) — deferred.
- No friends-feed, no posts/timeline runtime.
- No backend, Supabase, DB, upload (no base64/dataUrl), migrations, Railway.
- No separate `professional-profile` domain.
- No desktop adaptation of the professional layer (that is step-25).

## Architecture Impact Statement

All work is in the existing app-shell composition `client/src/app-v2/profile/`.
Four new section components + CSS for the professional mode, plus the mode-switch
wiring in `ProfilePage`/`ProfileHeader`/`ProfileModeSwitcher`. No new dependency,
no new route, no domain touched (`features-v2/*`, `server/domains-v2/*`). The
professional view is a mode/state, not a new domain. No removed product area
reintroduced.

## Legacy Containment

- Legacy runtime imports: PASS (none)
- Removed active routes/routers/chunks: PASS (none)
- Reference material used: YES — blueprint (read-only, distilled from `~/Desktop/Starykod-4`). No legacy code imported/copied.
- Exceptions: none

## Changed files

### New

| Path | Notes |
|---|---|
| `client/src/app-v2/profile/sections/ProfileProfessionalLayer.tsx` | Professional-mode orchestrator |
| `client/src/app-v2/profile/sections/ProfessionBlock.tsx` | Empty "Dodaj zawód" card |
| `client/src/app-v2/profile/sections/ProfileSpecialists.tsx` | Specialists empty + visibility toggle |
| `client/src/app-v2/profile/sections/ProfileProfessionalActivities.tsx` | Klasyczny/Sieć tabs + empty + "Co chcesz dodać?" sheet |
| `docs/review/step-24-professional-profile-mobile-layer/STEP_24_REPORT.md` | This report |

### Modified

| Path | Notes |
|---|---|
| `client/src/app-v2/profile/sections/ProfileModeSwitcher.tsx` | Enable Zawodowy as a real mode toggle |
| `client/src/app-v2/profile/sections/ProfileHeader.tsx` | Pass `onSelectProfessional` |
| `client/src/app-v2/profile/ProfilePage.tsx` | Mode-conditional render (personal vs professional) |
| `client/src/app-v2/profile/profile.module.css` | Professional-layer styles (mobile base) |
| `client/src/app-v2/profile/__tests__/ProfilePage.test.tsx` | Professional-mode tests; updated CTA test |
| `docs/review/REVIEW_REPORTS_INDEX.md` | Adds step-24 entry |

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
- mobile-first UX not downgraded

## Gates

| Gate | Status |
|---|---|
| `pnpm check` / `lint` / `test` | PASS (310/310, 42 files) |
| `pnpm build` | PASS |
| `pnpm rules:check` | PASS (21/21) |
| `pnpm arch:check:v2` | PASS (9/9) |
| `guards:domains` / `secrets` / `review` / `self-audit` | PASS |
| `pnpm guards:bramka` | PASS (25/25) |
| `guards:all-local` + `check-build-artifacts` | PASS |

## PRE-COMMIT DECISION

- Changed files: 4 new section components + 1 new report + 5 modified (3 components, CSS, test) + index
- Domains touched: `app-v2/profile` (professional mode added)
- Cross-domain imports: none
- Legacy runtime imports: none
- Removed routes/nav/build chunks: none
- Public DTO PII: none
- Media base64/dataUrl: none
- List pagination/limit/cursor: N/A
- Fake DONE/status truth: none — honest shell statuses + data pending flags
- Env safety: no `.env`/secrets
- TypeScript: PASS
- V2 lint: PASS
- Tests: PASS (310/310)
- Build: PASS
- Commit decision: COMMIT_ALLOWED

## SELF-AUDIT / INDEPENDENT REVIEW PASS

| # | Question | Answer |
|---|---|---|
| 1 | What I changed | Added 4 professional-layer section components + professional CSS; enabled the Zawodowy mode switch; branched ProfilePage rendering by mode. Added tests. Added this report + index. |
| 2 | What I might have broken | Low risk. Personal layer untouched in structure; professional content only renders in professional mode. All step-22/23 mobile tests pass. |
| 3 | Domain boundaries affected | None. Professional layer is app-shell composition; imports only its own sections. No feature/domain import. |
| 4 | Cross-domain imports check | `pnpm guards:domains` / `audit-domain-boundaries.mjs` PASS; source-scan test PASS. |
| 5 | Legacy/runtime check | `check-no-legacy-imports.mjs` PASS; source-scan test PASS. Blueprint read-only. |
| 6 | Fake DONE/status truth check | `check-fake-done.mjs` PASS. Honest statuses + data-pending flags; no banned terms. |
| 7 | PII/base64/secrets check | `check-public-dto-pii.mjs`, `check-media-base64.mjs`, secret scanners, env safety PASS. No PII; no upload. |
| 8 | Routes/nav/build graph check | `check-build-artifacts.mjs` + `check-removed-product-areas.mjs` PASS. No route added; professional is a mode; no removed area reintroduced. |
| 9 | Guard weakening check | No guard modified — `git diff scripts/` empty. Tests additive. |
| 10 | Evidence reviewed | This report; Gates table; `git status`/`git diff --stat`; re-read of new components. |
| 11 | Gates run | check, lint, test, build, rules:check, arch:check:v2, guards:domains, guards:secrets, guards:review, guards:self-audit, guards:bramka, guards:all-local, check-build-artifacts. |
| 12 | Remaining risks | (a) Empty-state-only professional layer until profession data exists. (b) Visual parity not screenshot-verified → MANUAL_REVIEW_REQUIRED. (c) Profession editor, availability, network graph data, desktop adaptation are later PRs. |

## Honest limitations

- Professional layer is empty-states-only (no profession/specialization data) →
  `PROFESSIONS_DATA_PENDING` / `SPECIALIZATIONS_DATA_PENDING`.
- No profession editor, availability runtime, or populated network graph.
- No live screenshots (no browser in env) → `MANUAL_REVIEW_REQUIRED`.
- Mock-local; no persistence; desktop adaptation is step-25.

## Blockers

None.

## Next step

- Step-25: desktop/tablet adaptation of this professional layer.
- Later: profession reference data + editor, availability, populated network view.
