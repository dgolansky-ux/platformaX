# SLICE 22A — Stabilization Report

> **Branch:** `feat/contacts-v2-clean-room-slice`
> **Pre-change HEAD:** `9d8fc1c` (Slice 20B-21 aggressive card visual polish)
> **Slice purpose:** P1 stabilization, architecture cleanup, UI truth alignment.
> **Date:** 2026-05-30

---

## 1. Executive verdict

| Question | Verdict | Evidence |
| --- | --- | --- |
| READY_FOR_NEXT_CLEANUP? | **YES** | All required gates PASS, depcruise circular dep eliminated, dirty tree consolidated. |
| READY_FOR_NEXT_FEATURES? | **NO** | Product runtime remains MOCK_LOCAL_ONLY for every feature except identity/media (PARTIAL_RUNTIME). Transport backend is still unwired. |
| READY_FOR_RUNTIME_BACKEND? | **PARTIAL** | Frontend boundaries (adapters, AppShell, composer event bus) are now consistent enough to swap mock for Supabase per slice. No backend transport in this slice. |
| READY_FOR_UI_OWNER_REVIEW? | **YES (mocked-data caveat)** | AppShell unifies the chrome; FAB is honest; "Wkrótce" placeholders removed from product UI. Visuals still need a live manual pass with screenshots. |

The system is **READY_WITH_DIRTY_TREE** for external code audit — the working tree is dirty by design (Slice 20B-FIX + 20B-21 + Slice 21 manage + Slice 22A all batched on one branch), and the audit package documents the full delta.

---

## 2. What changed

### B. AppShell consolidation (layout)
- `AppShell` is now the shared chrome for **21 app-v2 routes** (contacts, channels, communities and sub-routes, friend feed, notifications, manage dashboard, manage section routes, personal profile, professional section, friends, friend requests, contact requests).
- AppShell now exposes a "Przejdź do treści" skip link and a single `<main id="main-content">` landmark — every refactored route inherits it automatically.
- SIDEBAR_TO_MOBILE mapping extended (added `spolecznosci → communities`).
- `ProfilePage` (the owner dashboard at `/profile`) remains a custom shell because its `.page` class carries CSS tokens that cascade to every profile section — documented in Section 5 as P2.

### C. Mobile FAB / composer truth fix
- `FloatingNav` now uses `useLocation()` to detect the current route:
  - `/friends-feed` → dispatches `platformax:open-composer { surface: "friend_feed" }`.
  - `/communities/:slug/feed` → `surface: "community_feed"`.
  - `/channels/:slug` → `surface: "channel"`.
  - Anywhere else → button is **honestly disabled** with aria-label `Aby opublikować, otwórz feed znajomych, feed społeczności lub kanał`.
- Removed the "Wkrótce" modal — JSX, CSS classes (`modalOverlay`, `modalCard`, `modalTitle`, `modalText`, `modalButton`), and the corresponding tests.
- New `useComposerOpenEvent(surface, onOpen)` hook + `dispatchOpenComposer(surface)` helper exported from `features-v2/publishing`.
- `FriendFeedPage`, `CommunityFeedsShell`, `ChannelProfileShell` subscribe to the event and open the existing composer (modal for friend/community, inline scroll+focus for channel).
- 11 FloatingNav tests rewritten to assert the new route-aware contract.

### D. Important events + profile presentation truth alignment
- The `ProfilePersonalSections` "+ Dodaj post / + Dodaj wydarzenie" affordances stay honestly **disabled** with the tooltip `… — funkcja w przygotowaniu` (no fake save, no broken CTA).
- No new fake CTAs were added. Wiring to `ImportantEventComposer` / `ProfilePresentationComposer` remains future work (tracked as P2).

### E. Status truth alignment (registry + docs)
- `client/src/features-v2/feature-registry.ts`:
  - Introduced explicit taxonomy comment (SCAFFOLD_ONLY / UI_SHELL_ONLY / MOCK_LOCAL_ONLY / PARTIAL_RUNTIME / BACKEND_PARTIAL / DOC_ONLY / GAP / BROKEN / DEAD_CODE / PASS).
  - `PASS` reserved for production-verified features — **no feature qualifies** because no Supabase transport is wired.
  - Status corrections (see §6 table): communities-v2, channels, modules, public-hub, notifications-v2, friend-feed, professional-profile, personal-profile, publishing, content-display, manage, moderation → `MOCK_LOCAL_ONLY`.
  - `identity` and `media` → `PARTIAL_RUNTIME` (real Supabase Auth adapter / typed upload-intent adapter).

### F. UI cleanup (no fake / no debug user-visible)
- `DesktopSidebar`:
  - Removed the "Wkrótce" pill on disabled nav items; aria-label now says `… — funkcja w przygotowaniu`.
  - Section header renamed `Wkrótce → W przygotowaniu`.
- `WorkplacePage`: stripped `(wkrótce)` suffix from disabled owner action buttons — they are already visually disabled.
- Profile sections (`ProfileTopBar`, `ProfileStatusBar`, `ProfileProfessionalActivities`, `ProfilePortalCards`, `ProfilePersonalSections`): replaced user-visible "wkrótce" copy with `niedostępne` / `w przygotowaniu` (test fixtures updated to match).
- No remaining product-facing `MOCK_LOCAL_ONLY` / `BACKEND_PARTIAL` / `UI_SHELL_ONLY` text — those tokens now live exclusively in JSDoc / README / registry / tests.

### G. Code splitting / bundle warning pass
- `AppRouter` now lazy-loads every authenticated/demo route via `React.lazy + Suspense`. Auth + landing remain eager so first paint is instant.
- A shared `<RouteFallback>` renders "Ładuję…" inside the route region while a chunk streams.
- Build output (post-change):
  - Largest chunk: `index-B8oscCW1.js` **284 KB** (raw) / **90 KB** gzip — down from >500 KB.
  - Per-route chunks emitted for ProfilePage, CommunityFeedPage, ChannelProfilePage, Manage*, FriendFeedPageRoute, etc.
  - Vite no longer prints the "(!) Some chunks are larger than 500 kB after minification" warning.

### H. Security / PII static recheck
- `dangerouslySetInnerHTML`, `javascript:` URL handling, `readAsDataURL`, `base64 upload` — no new usages; the only matches are explicit policy tests asserting their absence.
- `localStorage` / `sessionStorage` — no new usages; existing matches are either comments documenting the policy, or `no-storage.test.ts` files asserting the prohibition.
- `@server/*` from `client/src` — **0 matches** (frontend never imports server runtime).
- `pnpm secrets:gitleaks` — `no leaks found`, 131 commits scanned, ~7 MB.

### I. Dead code / orphan pass
- Deleted **6 orphaned route-shell CSS modules** (each previously contained only `.page` + `.content` — fully replaced by `app-shell.module.css`):
  - `client/src/app-v2/contacts/ContactsPage.module.css`
  - `client/src/app-v2/channels/ChannelsPage.module.css`
  - `client/src/app-v2/communities/CommunitiesPage.module.css`
  - `client/src/app-v2/friend-feed/FriendFeedPageRoute.module.css`
  - `client/src/app-v2/manage/ManageLayout.module.css`
  - `client/src/app-v2/profile/PersonalProfileRoute.module.css`
- Kept SCAFFOLD_ONLY feature directories (search, chat, events, content-v2, audit, system, shared-ui, modules placeholder etc.) — they are documented domain placeholders, not dead code. They surface as `no-orphans` warnings in depcruise but are intentional.

### J. Gates
| Gate | Status | Detail |
| --- | --- | --- |
| `pnpm check` (tsc) | **PASS** | 0 errors |
| `pnpm lint` (eslint --max-warnings=0) | **PASS** | 0 warnings |
| `pnpm test` (vitest) | **PASS** | 1339 / 1339 tests, 167 / 167 files |
| `pnpm build` (vite) | **PASS** | No chunk-size warning, largest chunk 284 KB |
| `pnpm rules:check` | **PASS** | 43 / 43 guards |
| `pnpm arch:check:v2` | **PASS** | 9 / 9 guards |
| `pnpm guards:all-local` | **PASS** | 24 / 25 items (item 19 — branch protection — flagged `[EXT]` external, identical to baseline) |
| `pnpm depcruise:check` | **PASS** | 0 errors (eliminated `manage-dashboard ↔ manage-dashboard-sections` cycle by extracting `manage-dashboard-base.ts`); 44 pre-existing orphan warnings for SCAFFOLD_ONLY scaffolds |
| `pnpm secrets:gitleaks` | **PASS** | no leaks |
| `pnpm knip:check` | **WARNINGS** | Unused-exports inventory (pre-existing); no fail mode |

---

## 3. Files changed (by section)

### Section B (AppShell consolidation)
- `client/src/app-v2/navigation/AppShell.tsx` (skip link + main landmark + mobile mapping)
- `client/src/app-v2/navigation/app-shell.module.css` (skipLink, focus-visible)
- `client/src/app-v2/contacts/ContactsPage.tsx`
- `client/src/app-v2/contacts/ContactRequestsPage.tsx`
- `client/src/app-v2/friends/FriendsPage.tsx`
- `client/src/app-v2/friends/FriendRequestsPage.tsx`
- `client/src/app-v2/channels/ChannelsPage.tsx`
- `client/src/app-v2/channels/ChannelProfilePage.tsx`
- `client/src/app-v2/communities/CommunitiesPage.tsx`
- `client/src/app-v2/communities/CommunityProfilePage.tsx`
- `client/src/app-v2/communities/CommunityFeedPage.tsx`
- `client/src/app-v2/communities/CommunityHubPage.tsx`
- `client/src/app-v2/communities/CommunityChannelsPage.tsx`
- `client/src/app-v2/communities/CommunityModulesManagePage.tsx`
- `client/src/app-v2/communities/CommunityManagePage.tsx`
- `client/src/app-v2/communities/CommunityStructurePage.tsx`
- `client/src/app-v2/notifications/NotificationsPage.tsx`
- `client/src/app-v2/friend-feed/FriendFeedPageRoute.tsx`
- `client/src/app-v2/manage/ManageDashboard.tsx`
- `client/src/app-v2/manage/ManageSectionRoute.tsx`
- `client/src/app-v2/manage/PersonalProfileManageRoute.tsx`
- `client/src/app-v2/manage/ProfessionalSectionRoute.tsx`
- `client/src/app-v2/profile/PersonalProfileRoute.tsx`

### Section C (mobile FAB / composer truth)
- `client/src/app-v2/navigation/FloatingNav.tsx` (route-aware FAB)
- `client/src/app-v2/navigation/floating-nav.module.css` (removed modal classes)
- `client/src/app-v2/navigation/__tests__/FloatingNav.test.tsx` (rewritten)
- `client/src/features-v2/publishing/useComposerOpenEvent.ts` (new)
- `client/src/features-v2/publishing/public-api.ts` (export new hook)
- `client/src/features-v2/friend-feed/FriendFeedPage.tsx` (subscribe)
- `client/src/features-v2/communities-v2/feeds/CommunityFeedsShell.tsx` (subscribe)
- `client/src/features-v2/channels/ChannelProfileShell.tsx` (scroll + focus)

### Section E + F (status truth + UI cleanup)
- `client/src/features-v2/feature-registry.ts` (taxonomy + corrections)
- `client/src/app-v2/navigation/DesktopSidebar.tsx` (no Wkrótce pill, label rename)
- `client/src/features-v2/professional-profile/WorkplacePage.tsx`
- `client/src/app-v2/profile/sections/ProfileTopBar.tsx`
- `client/src/app-v2/profile/sections/ProfileStatusBar.tsx`
- `client/src/app-v2/profile/sections/ProfileProfessionalActivities.tsx`
- `client/src/app-v2/profile/sections/ProfilePortalCards.tsx`
- `client/src/app-v2/profile/sections/ProfilePersonalSections.tsx`
- `client/src/app-v2/profile/__tests__/ProfilePage.test.tsx`
- `client/src/app-v2/profile/__tests__/ProfileRuntime.test.tsx`

### Section G (code splitting)
- `client/src/app-v2/AppRouter.tsx` (lazy + Suspense)

### Section J (gates fix-ups)
- `shared/contracts/manage-dashboard-base.ts` (new — eliminates circular)
- `shared/contracts/manage-dashboard.ts` (re-exports primitives)
- `shared/contracts/manage-dashboard-sections.ts` (imports from base)

### Section I (deletions)
- Deleted 6 orphan CSS modules (see §2 / I).

### Section K (reports)
- `docs/review/stabilization-v2/slice-22a/SLICE_22A_PRECHANGE_DIRTY_TREE_INVENTORY.md` (new)
- `docs/review/stabilization-v2/slice-22a/SLICE_22A_STABILIZATION_REPORT.md` (this file)

---

## 4. Remaining P0 / P1 / P2

### P0 — none.

### P1 (must be addressed before next feature work)
1. **ProfilePage still owns a custom layout shell**: cannot use AppShell without refactoring the `.page`-rooted CSS-variable cascade. Suggested approach: introduce `<ProfileTokensProvider>` that injects the same tokens onto a `:root`-scoped wrapper inside AppShell. Estimated 1–2 hour task.
2. **No transport backend for any user-facing feature**: the entire product remains MOCK_LOCAL_ONLY (identity/media are PARTIAL_RUNTIME, the rest is mock). Cannot ship beyond the current internal demo until at least one feed/profile transport is wired.

### P2 (cleanup before owner UI review)
1. Wire `ImportantEventComposer` and `ProfilePresentationComposer` to the profile "+" affordances (currently disabled with truthful tooltip).
2. Visual manual review pass with screenshots for /communities, /communities/product-builders/feed, /channels, /channels/news, /friends-feed, /notifications, /manage, /profile, /profile/:username, /admin/moderation.
3. Knip inventory cleanup (44 orphan warnings, ~90 unused exports flagged).
4. Re-evaluate whether SCAFFOLD_ONLY feature folders (search, chat, events, …) should be deleted or kept as documented placeholders.
5. AppShell currently uses `tabIndex={-1}` on `<main>` so the skip link can focus it; verify with a screen-reader pass.

---

## 5. Status correction table

| Area | Previous claim | Corrected claim | Evidence |
| --- | --- | --- | --- |
| identity | PARTIAL | PARTIAL_RUNTIME | Real Supabase Auth adapter present, profile/onboarding mock-only |
| social | SCAFFOLD_ONLY | SCAFFOLD_ONLY (unchanged) | Folder placeholder; contacts ships its own mock under features-v2/social/contacts |
| communities-v2 | UI_SHELL_ONLY | MOCK_LOCAL_ONLY | Full mock adapter + interactions + structure adapters |
| content-v2 | SCAFFOLD_ONLY | SCAFFOLD_ONLY | Confirmed scaffolding |
| channels | UI_SHELL_ONLY | MOCK_LOCAL_ONLY | channels-mock-adapter ships full profile/feed/leads |
| modules | SCAFFOLD_ONLY | MOCK_LOCAL_ONLY | features-v2/modules/mock-adapter exists |
| public-hub | SCAFFOLD_ONLY | MOCK_LOCAL_ONLY | features-v2/public-hub/mock-adapter exists |
| notifications-v2 | UI_SHELL_ONLY | MOCK_LOCAL_ONLY | mock-adapter + event registry + tests |
| media | PARTIAL | PARTIAL_RUNTIME | Typed upload-intent adapter; backend storage env-gated |
| moderation | SCAFFOLD_ONLY | MOCK_LOCAL_ONLY | Surfaces wired via Slice 20 |
| friend-feed | UI_SHELL_ONLY | MOCK_LOCAL_ONLY | mock-adapter + publishing-adapter + teasers |
| professional-profile | UI_SHELL_ONLY | MOCK_LOCAL_ONLY | mock-adapter + workplaces + wizard |
| personal-profile | UI_SHELL_ONLY | MOCK_LOCAL_ONLY | mock-adapter + composer surfaces |
| publishing | PARTIAL | MOCK_LOCAL_ONLY | mock-adapter only; no real publish transport |
| content-display | PARTIAL | MOCK_LOCAL_ONLY | Post Display Kit + tests; no real fetch |
| manage | UI_SHELL_ONLY | MOCK_LOCAL_ONLY | Slice 21 mock adapter wires 13 sections |

**Important:** these corrections do not downgrade any *guard* result. They sharpen the *product-readiness* claim from "shell exists" to "fully mocked runtime, no transport".

---

## 6. Manual review checklist (for the owner)

Run the dev server (`pnpm dev`) and inspect each route in both desktop and mobile widths:

- [ ] `/communities` — discovery shell, search filter, category tiles, AppShell sidebar + mobile nav
- [ ] `/communities/product-builders/feed` — feed tabs, FAB on mobile opens composer
- [ ] `/notifications` — Activity Center, filter tabs, unread badge syncs with sidebar
- [ ] `/channels` — directory, AppShell consistency
- [ ] `/channels/news` (or any slug) — channel profile, mobile FAB scrolls and focuses composer
- [ ] `/friends-feed` — composer trigger, mobile FAB opens modal, workplace teasers
- [ ] `/manage` — 13-section dashboard, mobile + desktop, links to sub-sections
- [ ] `/manage/privacy`, `/manage/contact`, `/manage/notifications` — embedded editor panels
- [ ] `/profile` (owner) — custom shell still works, FloatingNav still visible
- [ ] `/profile/demo` (viewer) — PersonalProfileRoute through AppShell, edit affordances honest
- [ ] `/admin/moderation` — moderation queue, no AppShell intrusion (kept lazy)
- [ ] Mobile FAB on `/` (Centrum) and `/manage` — should render **disabled** with the explainer label, never the old "Wkrótce" modal.

---

## 7. Architecture invariants — confirmed for Slice 22A

- Modular monolit, clean-room V2.
- Zero legacy runtime imports (`pnpm rules:check` / `check-no-legacy-imports.mjs` PASS).
- Zero cross-domain internal imports (`check-architecture-import-graph.mjs` PASS).
- Frontend never imports `@server/*` (verified by grep + boundaries lint).
- `application-v2` remains the orchestrator (manage use-case spans 2+ domains).
- Public DTOs carry no PII (`check-public-dto-pii.mjs` PASS).
- friendship ≠ contact access ≠ friendship (contact consents kept owner-private in manage payload).
- No fake save / fake counters / fake upload introduced.
- No `localStorage` / `sessionStorage` as backend.
- No `dangerouslySetInnerHTML`, `readAsDataURL`, base64 byte encoding.
- No product-facing debug labels (MOCK_LOCAL_ONLY / BACKEND_PARTIAL / UI_SHELL_ONLY / Wkrótce) — all moved to dev-only registry/docs.
- No `any`, no `as any`, no `@ts-ignore` introduced (verified via `check-no-any-types.mjs` PASS within `guards:all-local`).
- No placeholder tests (`check-placeholder-tests.mjs` PASS).

---

## 8. Final status

**SLICE 22A: STABILIZATION COMPLETE — READY_WITH_DIRTY_TREE**

- All required gates pass on the baseline working tree.
- The dirty tree is the consolidated Slice 20B-FIX + 20B-21 + Slice 21 + Slice 22A delta; no work has been discarded.
- Next slice should focus on either (a) wiring the first real transport (suggested: friend-feed or notifications-v2), or (b) the ProfilePage AppShell migration (P1).

— End of Slice 22A report.
