# Step 19 — Public Landing Page (UI shell)

Generated: 2026-05-25

Status: `UI_SHELL_ONLY`

## Summary

Built the first iteration of the public landing page for PlatformaX V2. The page is composed in the `app-v2` shell layer, has no backend dependency, and renders as the root route served by `client/src/main.tsx → App.tsx`.

Per the owner's mid-task instructions, two requested sections were dropped before commit:

- the `Zapisy na wydarzenia` highlight section,
- the `Wszystko, czego potrzebujesz do działania` features grid.

A third instruction asked for tighter whitespace and a stronger mobile pass, which was applied across all remaining sections (smaller section padding tokens, smaller heading sizes, tighter card padding, stacked CTAs on mobile, smaller header height, hidden secondary header link below 360px).

The final scope contains: sticky header, hero, "Zbudowana z myślą o ludziach" values grid (4 cards), final CTA, and footer.

## Baseline

- Branch: `feat/landing-page` (cut from `main` at `b5eb4dd`)
- Initial gates state: all 25 BRAMKA acceptance points PASS on `main`
- Forbidden actions reviewed: no removed product areas, no legacy imports, no PII, no secrets, no base64, no fake DONE strings

## Scope

Requested:

- Public landing page rendered at the root route
- Polish-language copy per spec
- Modern, clean, white + blue, premium look
- Responsive, accessible, semantic HTML
- Small, modular components
- Smoke tests
- All gates clean

Not touched:

- Identity / auth domain (no login/signup wiring — anchors are explicit `href="#"` placeholders, see SiteHeader.tsx and HeroSection.tsx)
- Events domain
- Any feature-domain runtime
- Routing library — root-level component composition is the only routing needed for this single-page surface
- Any guard, governance doc, or domain registry entry was modified

## Changed files

| Path | Action | Notes |
|---|---|---|
| `client/src/App.tsx` | Modified | Replaced "Foundation" placeholder with `<LandingPage />` |
| `client/src/App.test.tsx` | Modified | Asserts the hero H1 instead of the old placeholder text |
| `client/src/app-v2/.gitkeep` | Deleted | Folder now has real content |
| `client/src/app-v2/README.md` | Created | Documents app-v2 shell scope and landing page status |
| `client/src/app-v2/landing/LandingPage.tsx` | Created | Composes header + sections + footer |
| `client/src/app-v2/landing/LandingPage.module.css` | Created | Page-level design tokens (CSS custom properties), container, base resets |
| `client/src/app-v2/landing/sections/SiteHeader.tsx` | Created | Sticky header with brand + login/signup placeholders |
| `client/src/app-v2/landing/sections/SiteHeader.module.css` | Created | Header styling |
| `client/src/app-v2/landing/sections/HeroSection.tsx` | Created | Title, lead, 2 CTAs, visual card composition |
| `client/src/app-v2/landing/sections/HeroSection.module.css` | Created | Hero styling |
| `client/src/app-v2/landing/sections/ValuesSection.tsx` | Created | 4 value cards (Bez reklam / Prywatność / Mniej hałasu / Sprawczość) |
| `client/src/app-v2/landing/sections/ValuesSection.module.css` | Created | Values grid styling |
| `client/src/app-v2/landing/sections/FinalCtaSection.tsx` | Created | "Dołącz do PlatformaX" + 2 placeholder CTAs |
| `client/src/app-v2/landing/sections/FinalCtaSection.module.css` | Created | Final CTA styling |
| `client/src/app-v2/landing/sections/SiteFooter.tsx` | Created | Brand, tagline, copyright |
| `client/src/app-v2/landing/sections/SiteFooter.module.css` | Created | Footer styling |
| `client/src/app-v2/landing/__tests__/LandingPage.test.tsx` | Created | 8 smoke tests covering header, hero, values, removed sections, final CTA, footer, placeholder hrefs |
| `docs/review/step-19-public-landing-page/STEP_19_REPORT.md` | Created | This report |
| `docs/review/REVIEW_REPORTS_INDEX.md` | Updated | Adds step-19 entry |

No files were deleted from the existing scaffold or governance areas. Two sections that were briefly created during this step (`FeaturesSection.*`, `ZapisySection.*`) were removed at the owner's request before commit — they were never on `main` and leave no trace.

## Architecture impact

- New code lives entirely under `client/src/app-v2/landing/` — the application shell composition layer. This matches the rule in `PlatformaX-V2-active-rules.md` §3 that `app-v2` may compose domains but must not own data or import legacy/removed areas.
- No feature-domain folder under `client/src/features-v2/` was touched.
- No new domain or feature was registered. No domain status was upgraded.
- No backend runtime was added (`server/` untouched).
- No new dependencies were installed. The implementation uses React 19, native CSS Modules (Vite built-in), and inline SVG icons only.

## Routing / URL

The landing page is the **root route**.

- Local dev URL: `http://localhost:5173/` (`pnpm dev`)
- Production build: served from `dist/index.html` after `pnpm build`

There is no client-side router yet; `main.tsx` mounts `<App />`, which renders `<LandingPage />` directly. This is intentional — adding a router (react-router, etc.) is out of scope and would be a separate change.

## Honesty about placeholders

The following CTAs are explicit `href="#"` placeholders, each marked with an in-line comment at the call site:

| CTA | Location | Reason |
|---|---|---|
| "Zaloguj się" (header) | `SiteHeader.tsx` | identity domain not implemented |
| "Załóż konto" (header) | `SiteHeader.tsx` | identity domain not implemented |
| "Załóż konto" (hero) | `HeroSection.tsx` | identity domain not implemented |
| "Zaloguj się" (hero) | `HeroSection.tsx` | identity domain not implemented |
| "Załóż konto" (final CTA) | `FinalCtaSection.tsx` | identity domain not implemented |
| "Zaloguj się" (final CTA) | `FinalCtaSection.tsx` | identity domain not implemented |

This is asserted by a test (`placeholder CTAs use href='#'`) so any accidental change is caught.

## Gates

All commands run from the repo root on Windows 11 / PowerShell, `pnpm` 9.x.

| Gate | Command | Status | Notes |
|---|---|---|---|
| TypeScript | `pnpm check` | PASS | `tsc --noEmit` clean |
| Lint | `pnpm lint` | PASS | `eslint . --max-warnings=0` clean |
| Tests | `pnpm test` | PASS | 33 test files, 238 tests passed (8 new landing-page tests + existing 230) |
| Build | `pnpm build` | PASS | `vite build` → 40 modules, ~63 kB JS gzip, ~3 kB CSS gzip |
| Rules umbrella | `pnpm rules:check` | PASS | 21/21 guards green (includes pagination, fake-done, legacy, removed-areas, complexity, etc.) |
| Arch umbrella | `pnpm arch:check:v2` | PASS | 9/9 architecture guards green |
| All-local guards | `pnpm guards:all-local` | PASS | rules:check + secret scan + script safety + review index + pre-commit decision + self-audit + BRAMKA acceptance |
| BRAMKA acceptance | `pnpm guards:bramka` | PASS | 25/25 points |
| Build-artifact scan | `node scripts/check-build-artifacts.mjs` | PASS | No removed-area chunks in `dist/` |

The pagination guard initially flagged `getAllByRole` in the landing test file as a substring match against `getAll`. This was resolved by adding the documented `// TEST_FIXTURE` safe-marker comment (see `scripts/check-pagination.mjs` SAFE_MARKERS) — the guard itself was **not** modified, weakened, or bypassed.

## PRE-COMMIT DECISION

- Changed files: 18 files (see table above)
- Domains touched: none (app-v2 shell only)
- Cross-domain imports: none — `LandingPage` imports only its own sections; no `features-v2/*` or `domains-v2/*` imports
- Legacy runtime imports: none
- Removed routes/nav/build chunks: none — no `/seller`, `/marketplace`, `/calendar`, `/notes`, `/habits`, `/tasks`, `/pages`, `/pasje`, `/fundraiser`, `/donations`, `/commerce`, `/productivity` anywhere
- Public DTO PII: none — page is static, no API calls, no DTOs
- Media base64/dataUrl: none — icons are inline SVG, no images uploaded or embedded as data URLs
- List pagination/limit/cursor: N/A — no runtime lists; static arrays of value cards rendered via `.map`
- Fake DONE/status truth: none — status is `UI_SHELL_ONLY`, no banned terms used
- Env safety: no `.env` files touched, no secrets
- TypeScript: PASS
- V2 lint: PASS (`pnpm lint:v2` also covered by `pnpm lint`)
- Tests: PASS (238/238)
- Build: PASS
- Commit decision: COMMIT_ALLOWED — all gates green, scope matches owner's request, two mid-task removals applied

## SELF-AUDIT / INDEPENDENT REVIEW PASS

| # | Question | Answer |
|---|---|---|
| 1 | What I changed | Added `client/src/app-v2/landing/` (LandingPage + 4 sections + their CSS modules + 1 test file), added `client/src/app-v2/README.md`, replaced `client/src/App.tsx` body, updated `client/src/App.test.tsx`, removed `client/src/app-v2/.gitkeep`, added this report folder and updated the review index. Two short-lived files (`FeaturesSection.*`, `ZapisySection.*`) were created and removed within this step. |
| 2 | What I might have broken | Risk is low. The previous App.tsx was a placeholder splash screen with no other consumers. The only other test that referenced App.tsx (`App.test.tsx`) was updated to match the new content. No guard, governance doc, or domain file was touched. The pre-commit decision check still passes because step-19 ships with a full PRE-COMMIT DECISION + SELF-AUDIT section. |
| 3 | Domain boundaries affected | None. No feature-domain code under `client/src/features-v2/` was imported or modified. The page lives in the shell layer (`app-v2`). |
| 4 | Cross-domain imports check | Verified by `audit-domain-boundaries.mjs` (PASS) and by re-grepping LandingPage and its sections — only relative imports inside `app-v2/landing/`, plus `react` type import in ValuesSection. |
| 5 | Legacy/runtime check | Verified by `check-no-legacy-imports.mjs` (PASS). No imports from `client/src/features/`, `client/src/pages/`, `client/src/components/`, `server/domains/`, or any legacy folder. No relative imports containing `/pages/`, `/components/`, `/features/`, `/domains/`, `/legacy/` substrings — folders named only `landing/`, `sections/`, `__tests__/`. |
| 6 | Fake DONE/status truth check | Verified by `check-fake-done.mjs` (PASS) and by reading the report end-to-end. No `DONE`, `FULL_DONE`, `BACKEND_DONE`, `VISUAL_DONE`, `CLEAN`, `production-ready`, `complete` claims. Status is `UI_SHELL_ONLY`. |
| 7 | PII/base64/secrets check | Verified by `check-public-dto-pii.mjs`, `check-media-base64.mjs`, `check-secret-scan.mjs`, `check-local-secret-scan.mjs`, `check-env-safety.mjs` (all PASS). The page contains no real PII — the in-card name "Anna Kowalska" and "Marta Nowak"... wait, "Marta Nowak" was in the deleted ZapisySection only. The remaining sample name "Anna Kowalska" with a hand-written quote is illustrative copy in the hero visual card, not real user data. |
| 8 | Routes/nav/build graph check | `dist/` rebuilt and scanned by `check-build-artifacts.mjs` (PASS) — no removed-area chunks. `check-removed-product-areas.mjs` (PASS) on the source. No router was introduced; the page is mounted via `App.tsx`. |
| 9 | Guard weakening check | No guard script was modified. The pagination warning was resolved with the documented `TEST_FIXTURE` safe-marker comment in the test file — the guard's allowlist was not extended, no regex relaxed, no threshold changed. Verified by `git diff scripts/` (no changes). |
| 10 | Evidence reviewed | `docs/review/step-19-public-landing-page/STEP_19_REPORT.md` (this file); command outputs captured inline in the Gates table; `git status` and `git diff --stat` reviewed before committing. |
| 11 | Gates run | `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm rules:check`, `pnpm arch:check:v2`, `pnpm guards:all-local`, `pnpm guards:bramka`, `node scripts/check-build-artifacts.mjs` — all exited 0. |
| 12 | Remaining risks | (a) The landing page has no client-side router — adding one is a future change. (b) Auth/identity CTAs are placeholders; users will see `href="#"` until identity domain is implemented. (c) No visual regression tests yet — only structural smoke tests. (d) No e2e tests; the in-browser look has not been screenshot-verified in this run. |

## Blockers

None.

## Next step

- When identity domain reaches `UI_SHELL_ONLY`, replace the six `href="#"` placeholders with real navigation (likely once a router and the `/login` / `/signup` routes exist).
- Consider adding a visual regression / screenshot test once the routing layer is in place.
