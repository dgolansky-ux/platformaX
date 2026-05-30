# SLICE 23 — Foundation hardening report

> **Branch:** `feat/contacts-v2-clean-room-slice`
> **Starting HEAD:** `579e9ed` (end of Slice 22A)
> **Date:** 2026-05-30
> **Purpose:** Close remaining P1/P2 foundation issues — ProfilePage →
> AppShell migration, real screenshot evidence, dead-code prune, status
> truth, security recheck, audit ZIP — before runtime/backend work.

---

## 1. Executive verdict

| Question | Verdict | Evidence |
| --- | --- | --- |
| READY_FOR_NEXT_FOUNDATION_SLICE? | **YES** | All required gates PASS, dirty-tree consolidation from Slice 22A holds, AppShell now covers `/profile` (P1 from Slice 22A closed). |
| READY_FOR_RUNTIME_BACKEND? | **PARTIAL** | Frontend boundaries (AppShell, composer event bus, ProfileTokensProvider) are consistent enough for a single domain transport to be wired (suggested first: friend-feed or notifications-v2). No backend transport is wired in Slice 23. |
| READY_FOR_UI_OWNER_REVIEW? | **YES** | 16 real Playwright screenshots saved under `docs/review/visual-v2/slice-23/screenshots/`. No "Wkrótce" labels in product UI. AppShell layout is consistent across captured routes. |
| READY_FOR_EXTERNAL_AUDIT? | **YES** | Governance / rules / guards / architecture / ADR / security / AI policy / profile blueprint files all bundled; manifest's `governanceCoverage` is fully ✅; ZIP final status `READY_FOR_EXTERNAL_AUDIT` (clean tree) or `READY_WITH_DIRTY_TREE` (if generated mid-commit). |

---

## 2. What changed

### Status truth (Section 2)
- `docs/review/foundation-v2/slice-23/SLICE_23_STATUS_TRUTH_RECONCILIATION.md`
  separates historical reports (Slice 20C dirty-tree audit, Slice 21
  manage) from the current clean-state at HEAD `579e9ed` and the
  Slice 23 outputs. No historical report was rewritten or deleted.

### ProfilePage → AppShell finalization (Section 3)
- New `client/src/app-v2/profile/styles/profile-layout.module.css`
  exposes design tokens via a `.profileTokens` class instead of the
  old `.page` class. AppShell now owns the route chrome.
- `client/src/app-v2/profile/ProfilePage.tsx` is wrapped with
  `<AppShell active="profil" displayName={…} avatarInitial={…}>` and
  no longer mounts `DesktopSidebar` / `FloatingNav` manually.
- The CSS-variable cascade is preserved by keeping the
  `.profileTokens` wrapper as an ancestor of all profile sections.
- All 38 profile tests pass unchanged.

### Screenshot tooling (Section 4)
- `pnpm add -D @playwright/test` (1.60.0) + `pnpm exec playwright install chromium`.
- New `playwright.config.ts` boots the Vite dev server, runs in two
  projects (`chromium-desktop` 1440×1000, `chromium-mobile` 390×844).
- New `tests/visual-v2/app-v2-screenshots.spec.ts` captures **8 routes
  × 2 viewports = 16 screenshots** under
  `docs/review/visual-v2/slice-23/screenshots/`.
- New `package.json` script `screenshots:v2`.
- Screenshots are **real** — none faked, none ENV_BLOCKED.

### Knip / depcruise / orphan cleanup (Section 5)
- Deleted `client/src/features-v2/communities-v2/CommunitiesList.tsx`
  (truly orphan).
- Removed unused `ProfileStatusBar` combined wrapper from
  `client/src/app-v2/profile/sections/ProfileStatusBar.tsx`;
  `ProfileHeader` already uses the two pieces directly.
- 44 depcruise `no-orphans` warnings and 89 knip-flagged exports
  remain — every one is classified `KEEP_SCAFFOLD_ONLY`,
  `KEEP_PUBLIC_CONTRACT`, or `KEEP_INFRASTRUCTURE` in
  `SLICE_23_KNIP_DEPCRUISE_ORPHAN_DECISION_REGISTER.md`.

### Domain boundary recheck (Section 6)
- `pnpm arch:check:v2` PASS (9 / 9 guards).
- No frontend → `@server/*` import (0 matches).
- No cross-domain `internal/` import (0 matches).
- `application-v2` use-cases continue to orchestrate 2+ domain flows
  via public-api barrels.
- Full audit in `SLICE_23_DOMAIN_BOUNDARY_RECHECK.md`.

### Code quality hardening (Section 7)
- `:` any / `as any` / `@ts-ignore` / placeholder tests / skipped
  tests / TODOs in production code: **0 each**.
- The only `@ts-expect-error` is in a single contact-access test
  that exercises the runtime guard against a forbidden enum — kept
  with explanatory comment.

### UI truth cleanup (Section 8)
- One residual user-facing "wkrótce" string in
  `client/src/features-v2/identity/auth/auth-adapter.ts` reworded
  from "Backend tożsamości zostanie podłączony wkrótce." to
  "Backend tożsamości nie jest jeszcze dostępny.".
- Remaining "Wkrótce" mentions (7) are all in JSDoc / READMEs /
  tests; none render to a user.

### Security / PII recheck (Section 9)
- `pnpm secrets:gitleaks`: **no leaks** in 133 commits.
- All PII-class guards PASS (`check-public-dto-pii.mjs`,
  `check-dto-privacy-classification.mjs`,
  `check-logging-pii-security.mjs`, identity / media
  `no-storage.test.ts`, `public-mapper-no-pii.test.ts`,
  `public-mapper-no-leak.test.ts`).
- Slice 23 introduced no new `dangerouslySetInnerHTML`, `javascript:`
  URL handling, `readAsDataURL`, or `localStorage`/`sessionStorage`
  fallback.

---

## 3. Files changed in Slice 23

### Source (4 files)
- `client/src/app-v2/profile/ProfilePage.tsx` (AppShell wrap)
- `client/src/app-v2/profile/styles/profile-layout.module.css` (token rename)
- `client/src/app-v2/profile/sections/ProfileStatusBar.tsx` (orphan wrapper removed)
- `client/src/features-v2/identity/auth/auth-adapter.ts` (wording)

### Deleted (1 file)
- `client/src/features-v2/communities-v2/CommunitiesList.tsx`

### Tooling / config (4 files)
- `package.json` (`@playwright/test` devDep + `screenshots:v2` script)
- `pnpm-lock.yaml`
- new `playwright.config.ts`
- new `tests/visual-v2/app-v2-screenshots.spec.ts`

### Reports + evidence (9 docs + 16 PNGs)
- new `docs/review/foundation-v2/slice-23/SLICE_23_PRECHANGE_INVENTORY.md`
- new `docs/review/foundation-v2/slice-23/SLICE_23_STATUS_TRUTH_RECONCILIATION.md`
- new `docs/review/foundation-v2/slice-23/SLICE_23_KNIP_DEPCRUISE_ORPHAN_DECISION_REGISTER.md`
- new `docs/review/foundation-v2/slice-23/SLICE_23_DOMAIN_BOUNDARY_RECHECK.md`
- new `docs/review/foundation-v2/slice-23/SLICE_23_CODE_QUALITY_HARDENING_REPORT.md`
- new `docs/review/foundation-v2/slice-23/SLICE_23_UI_TRUTH_CLEANUP_REPORT.md`
- new `docs/review/foundation-v2/slice-23/SLICE_23_SECURITY_PII_RECHECK.md`
- new `docs/review/foundation-v2/slice-23/SLICE_23_GOVERNANCE_FILES_IN_ZIP_REPORT.md`
- new `docs/review/foundation-v2/slice-23/SLICE_23_FOUNDATION_HARDENING_REPORT.md` (this file)
- new `docs/review/visual-v2/slice-23/SLICE_23_VISUAL_SCREENSHOT_REPORT.md`
- new `docs/review/visual-v2/slice-23/screenshots/*.png` (16 files)

### Audit ZIP tooling (1 file)
- new `scripts/audit/create-slice-23-foundation-hardening-zip.mjs`

---

## 4. Gate matrix

| Gate | Status | Detail |
| --- | --- | --- |
| `pnpm check` (tsc) | **PASS** | 0 errors. |
| `pnpm lint` | **PASS** | eslint `--max-warnings=0`, clean. |
| `pnpm test` | **PASS** | 1339 / 1339 tests across 167 / 167 files (Slice 23 added Playwright `*.spec.ts` outside vitest's include glob). |
| `pnpm build` | **PASS** | No chunk-size warning, largest chunk 284 KB raw / 90 KB gzip. |
| `pnpm rules:check` | **PASS** | 43 / 43 guards. |
| `pnpm arch:check:v2` | **PASS** | 9 / 9 guards. |
| `pnpm guards:all-local` | **PASS** | 24 / 25 items (item 19 branch protection `[EXT]` external; identical to baseline). |
| `pnpm depcruise:check` | **PASS** | 0 errors, 44 `no-orphans` warnings (all classified KEEP_*). |
| `pnpm secrets:gitleaks` | **PASS** | No leaks, 133 commits scanned (~7 MB). |
| `pnpm knip:check` | **WARNINGS** | Pre-existing inventory; all classified KEEP_* in the orphan register. No fail mode. |
| `pnpm screenshots:v2` | **PASS** | 16 / 16 routes captured (8 routes × 2 viewports). |

---

## 5. Screenshot evidence

| Route | Desktop PNG | Mobile PNG | Status |
| --- | --- | --- | --- |
| `/communities` | `communities.desktop.png` | `communities.mobile.png` | PASS |
| `/communities/product-builders/feed` | `communities-product-builders-feed.desktop.png` | `communities-product-builders-feed.mobile.png` | PASS |
| `/notifications` | `notifications.desktop.png` | `notifications.mobile.png` | PASS |
| `/channels` | `channels.desktop.png` | `channels.mobile.png` | PASS |
| `/friends-feed` | `friends-feed.desktop.png` | `friends-feed.mobile.png` | PASS |
| `/manage` | `manage.desktop.png` | `manage.mobile.png` | PASS |
| `/profile` | `profile.desktop.png` | `profile.mobile.png` | PASS (now inside AppShell) |
| `/profile/demo` | `profile-demo.desktop.png` | `profile-demo.mobile.png` | PASS |

All saved to `docs/review/visual-v2/slice-23/screenshots/`. None faked.

---

## 6. Remaining P0 / P1 / P2

### P0 — none.

### P1 (must precede the first real backend wiring)
1. **Wire the first Supabase transport** for a low-risk domain. Suggested: notifications-v2 (write/read are independent) or friend-feed (composer already exists; mock adapter is the minimal contract surface).
2. **Add `axe-core` accessibility scan** to the Playwright suite — UI-shell parity has been verified visually but not with WCAG checks.

### P2 (cleanup)
1. Split `ProfilePage` into `OwnerProfileRoute` / `ViewerProfileRoute` once identity transport returns owner state synchronously.
2. Wire `ImportantEventComposer` / `ProfilePresentationComposer` to the profile "+" affordances.
3. Decide which SCAFFOLD_ONLY domain folders to keep vs collapse (currently all retained per the orphan decision register).
4. Consider splitting the 14-file `features-v2/manage/mock-adapter.ts` once backend wiring removes some of the fixture surface.
5. Once a real auth transport ships, redo the security/PII recheck against the live SQL adapter.

---

## 7. Status correction table

| Area | Current status | Evidence | Next action |
| --- | --- | --- | --- |
| Feature runtime — `identity` | PARTIAL_RUNTIME | `auth-adapter.ts` returns honest `NOT_CONFIGURED` until Supabase env wired | Add real Supabase Auth env + smoke test. |
| Feature runtime — `media` | PARTIAL_RUNTIME | Typed upload-intent adapter; storage backend env-required | Wire backend storage. |
| Feature runtime — every other V2 feature | MOCK_LOCAL_ONLY | `client/src/features-v2/feature-registry.ts` | Pick one and wire transport. |
| `ProfilePage` layout exception | RESOLVED | This slice migrated to AppShell with token cascade preserved | None. |
| User-visible debug text | CLEAN | UI truth cleanup report | None. |
| Visual evidence | REAL | 16 screenshots captured under `docs/review/visual-v2/slice-23/screenshots/` | Owner manual review with screenshots. |
| Governance coverage | COMPLETE | `SLICE_23_GOVERNANCE_FILES_IN_ZIP_REPORT.md` + manifest `governanceCoverage` | Add `axe-core` for a11y. |

---

## 8. Final status

**`READY_FOR_EXTERNAL_AUDIT`** (with `READY_WITH_DIRTY_TREE` downgrade
if the ZIP is generated against the working tree mid-commit — the
manifest exposes both states truthfully).

- All required gates pass.
- ProfilePage P1 from Slice 22A is closed.
- Real screenshot evidence captured for 8 routes × 2 viewports.
- Governance / rules / guards / architecture / AI / security files
  fully bundled with manifest-level `governanceCoverage` ✅.
- No P0 outstanding; P1 items are concrete (real transport wiring +
  a11y) and out of foundation-hardening scope.

— End of Slice 23 foundation hardening report.
