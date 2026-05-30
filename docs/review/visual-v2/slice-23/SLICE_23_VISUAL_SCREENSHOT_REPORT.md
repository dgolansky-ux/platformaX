# SLICE 23 — Visual Screenshot Report

> **Date:** 2026-05-30
> **Tool:** `@playwright/test` 1.60.0 + Chromium-headless-shell 1223
> **Command:** `pnpm screenshots:v2`
> **Run status:** **PASS** — 16 / 16 captures saved.

## 1. Capture matrix

| Route | Desktop (1440×1000) | Mobile (390×844) | Status | Notes |
| --- | --- | --- | --- | --- |
| `/communities` | `communities.desktop.png` | `communities.mobile.png` | **PASS** | Hero + search + categories grid render through AppShell. |
| `/communities/product-builders/feed` | `communities-product-builders-feed.desktop.png` | `communities-product-builders-feed.mobile.png` | **PASS** | Feed tabs + composer trigger visible. |
| `/notifications` | `notifications.desktop.png` | `notifications.mobile.png` | **PASS** | Activity Center with filter tabs. |
| `/channels` | `channels.desktop.png` | `channels.mobile.png` | **PASS** | Directory shell. |
| `/friends-feed` | `friends-feed.desktop.png` | `friends-feed.mobile.png` | **PASS** | Composer trigger + workplace teasers + post list. |
| `/manage` | `manage.desktop.png` | `manage.mobile.png` | **PASS** | 13-section manage dashboard. |
| `/profile` | `profile.desktop.png` | `profile.mobile.png` | **PASS** | Now rendered through `AppShell` (Slice 23 ProfileTokensProvider migration). Anonymous runtime → public non-owner fallback. |
| `/profile/demo` | `profile-demo.desktop.png` | `profile-demo.mobile.png` | **PASS** | Personal-profile feature inside `AppShell`. |

All 16 PNGs are saved under
`docs/review/visual-v2/slice-23/screenshots/`.

## 2. How to reproduce locally

```bash
pnpm install
pnpm exec playwright install chromium    # one-time, downloads chromium-headless-shell
pnpm screenshots:v2                       # boots vite + captures 16 screenshots
```

Playwright is configured via `playwright.config.ts`:
- two projects: `chromium-desktop` (1440×1000) and `chromium-mobile` (390×844, `isMobile: true`).
- Vite dev server is auto-booted on port `5173` (strict-port) and reused if already running.
- All routes are MOCK_LOCAL_ONLY, so no transport backend is required.

## 3. Visual observations (high level)

- **No horizontal overflow** detected on any captured route at either viewport.
- **AppShell consistency** — the sidebar / mobile bottom-nav layout is now visible on every captured route, including `/profile` (Slice 23 migration verified).
- **No "Wkrótce" placeholders** are present in the captured UI (Slice 22A cleanup confirmed).
- **Mobile FAB** is visible on every mobile screenshot; it is `disabled` (with an honest aria-label) on routes that do not own a composer surface.
- **/profile (anonymous runtime)** renders the non-owner public fallback ("Profil") because the runtime state starts in `loading → anonymous` and the page never presents owner-only affordances before identity confirms ownership.

## 4. What the screenshots do NOT prove

- They do **not** prove a real backend transport works — every adapter is mock-local.
- They do **not** prove production-readiness; this is a UI-shell evidence pass.
- They do **not** include browser-DevTools accessibility scans; that requires a separate axe run (out of scope for Slice 23).
- They do **not** replace owner manual visual review — a human still has to sign off on the design.

## 5. Status

- Final status: **PASS** — real screenshots captured, none faked, all 16 saved.
