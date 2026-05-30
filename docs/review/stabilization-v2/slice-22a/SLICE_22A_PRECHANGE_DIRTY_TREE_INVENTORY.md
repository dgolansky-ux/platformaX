# SLICE 22A — Pre-Change Dirty Tree Inventory

> **Generated:** 2026-05-30
> **Purpose:** Capture the exact state of the working tree before any Slice 22A
> stabilization edit so we can prove nothing was discarded.

## 1. Branch / commit baseline

| Item | Value |
| --- | --- |
| Branch | `feat/contacts-v2-clean-room-slice` |
| HEAD SHA | `9d8fc1c435be0d98e81c40cf94a707dd3f8fee3c` |
| HEAD subject | `feat(v2): slice 20B-21 — aggressive card visual polish (Facebook-feel pass)` |
| Recent slice arc | Slice 13 → 14 → 15 → 17 → 18 → 19 → 20 (mod) → 20B → 20B-21 → 20C audit → 21 |
| Stashes | `stash@{0}: On feat/portal-cards-pulse-badge: temp-stash-for-audit-snapshot` (NOT touched by this slice) |

## 2. Modified files (43 total)

Origin classification:
- **(20B/21 UI polish)** — Slice 20B-FIX + Slice 21 (Facebook-feel + composer wiring)
- **(20C audit hook)** — registry/governance touched by audit reporting
- **(test sync)** — assertion drift coming with the polish

```
 M client/src/app-v2/AppRouter.tsx                                          (21 composer/router)
 M client/src/app-v2/channels/ChannelsPage.module.css                       (20B polish)
 M client/src/app-v2/communities/CommunitiesPage.module.css                 (20B polish)
 M client/src/app-v2/contacts/ContactsPage.module.css                       (20B polish)
 M client/src/app-v2/friend-feed/FriendFeedPageRoute.module.css             (20B polish)
 M client/src/app-v2/manage/ManageDashboard.module.css                      (manage redesign)
 M client/src/app-v2/manage/ManageDashboard.tsx                             (manage redesign)
 M client/src/app-v2/manage/ManageLayout.module.css                         (manage redesign)
 M client/src/app-v2/manage/__tests__/ManageDashboard.test.tsx              (test sync)
 M client/src/app-v2/navigation/DesktopSidebar.tsx                          (21 top-tier sidebar)
 M client/src/app-v2/navigation/FloatingNav.tsx                             (21 mobile FAB WIP)
 M client/src/app-v2/navigation/__tests__/FloatingNav.test.tsx              (test sync)
 M client/src/app-v2/navigation/desktop-sidebar.module.css                  (21 sidebar polish)
 M client/src/app-v2/navigation/floating-nav.module.css                     (21 mobile nav polish)
 M client/src/app-v2/profile/styles/profile-layout.module.css               (20B polish)
 M client/src/features-v2/channels/ChannelInteractions.module.css           (20B polish)
 M client/src/features-v2/channels/Channels.module.css                      (20B polish)
 M client/src/features-v2/communities-v2/CommunitiesShell.module.css        (20B polish)
 M client/src/features-v2/communities-v2/CommunitiesShell.tsx               (21 composer wire)
 M client/src/features-v2/communities-v2/__tests__/CommunitiesShell.test.tsx (test sync)
 M client/src/features-v2/communities-v2/cards/Cards.module.css             (20B polish)
 M client/src/features-v2/communities-v2/cards/CommunityCategoryCard.tsx    (20B polish)
 M client/src/features-v2/communities-v2/cards/CreateCommunityCard.tsx      (20B polish)
 M client/src/features-v2/communities-v2/cards/MyCommunityCard.tsx          (20B polish)
 M client/src/features-v2/communities-v2/cards/RecommendedCommunityCard.tsx (20B polish)
 M client/src/features-v2/communities-v2/feeds/Feeds.module.css             (20B polish)
 M client/src/features-v2/communities-v2/feeds/interactions/Interactions.module.css (20B polish)
 M client/src/features-v2/communities-v2/sections/CommunitiesSearch.tsx     (20B polish)
 M client/src/features-v2/communities-v2/sections/MyCommunitiesSection.tsx  (20B polish)
 M client/src/features-v2/communities-v2/sections/Sections.module.css       (20B polish)
 M client/src/features-v2/content-display/ContentDisplay.module.css         (20B polish)
 M client/src/features-v2/content-display/PostActionBar.tsx                 (21 composer surface)
 M client/src/features-v2/content-display/PostDisplayKit.tsx                (21 composer surface)
 M client/src/features-v2/content-display/variants/PostCardVariants.tsx     (20B polish)
 M client/src/features-v2/feature-registry.ts                               (20C audit registry)
 M client/src/features-v2/friend-feed/__tests__/FriendFeedPage.test.tsx     (test sync)
 M client/src/features-v2/notifications-v2/NotificationCard.tsx             (20B polish)
 M client/src/features-v2/notifications-v2/NotificationsPage.module.css     (20B polish)
 M client/src/features-v2/publishing/ComposerTrigger.tsx                    (21 trigger)
 M client/src/features-v2/publishing/Publishing.module.css                  (21 trigger)
 M client/src/main.tsx                                                      (global styles)
 M docs/governance/EXCEPTIONS_REGISTER.md                                   (20C audit hook)
 M scripts/check-feature-registry.mjs                                       (20C audit hook)
```

Total: **43 modified files, +3212 / −1708 lines** (per `git diff --stat`).

## 3. Untracked entries

Origin classification:

| Path | Origin | Disposition for Slice 22A |
| --- | --- | --- |
| `client/src/app-v2/manage/ManageSectionRoute.tsx` | Slice 21 manage routes (already imported by `AppRouter.tsx`) | KEEP — load-bearing for current router |
| `client/src/app-v2/navigation/AppShell.tsx` | Slice 21 layout primitive | KEEP — central to Section B |
| `client/src/app-v2/navigation/app-shell.module.css` | Slice 21 layout primitive | KEEP |
| `client/src/app-v2/styles/globals.css` | Global tokens introduced post-20B | KEEP — referenced by `main.tsx` |
| `client/src/features-v2/manage/` (full folder) | Slice 21 manage orchestrator (ADR-016) | KEEP — referenced from app-v2 manage routes |
| `docs/architecture/adr/ADR-016-manage-orchestrator-and-port-pattern.md` | ADR for manage | KEEP |
| `docs/review/global-audit-v2/slice-20c/` | Slice 20C audit reports (9 docs) | KEEP — evidence for status truth alignment |
| `docs/review/manage-v2/MANAGE_SLICE_21_*.md` | Slice 21 manage report | KEEP |
| `docs/review/ui-v2/UI_POLISH_SLICE_20B_FIX_TOP_TIER_REDESIGN_REPORT.md` | Slice 20B-FIX UI report | KEEP |
| `scripts/audit/create-full-audit-zip.mjs` | Audit ZIP tooling | KEEP — referenced by audit pipeline |
| `scripts/audit/validate-audit-zip.mjs` | Audit ZIP tooling | KEEP |
| `scripts/create-slice-20c-zip.mjs` | Slice 20C audit ZIP script | KEEP |
| `server/application-v2/use-cases/manage/` (full folder) | Slice 21 server-side manage use-case (mock adapter) | KEEP — referenced by manage shell |
| `shared/contracts/manage-dashboard.ts` | Slice 21 contract | KEEP |
| `shared/contracts/manage-dashboard-sections.ts` | Slice 21 contract | KEEP |
| `ZIPY/` | Audit ZIP outputs (memory-mandated location) | LEAVE — gitignored-style local artefact, do NOT add to repo |

No file in the dirty tree looks accidental. All modifications belong to documented slice arcs (20B-FIX, 21, 20C audit).

## 4. Files expected from Slice 21 (and confirmed present)

- `client/src/app-v2/navigation/AppShell.tsx` ✓
- `client/src/app-v2/navigation/app-shell.module.css` ✓
- `client/src/app-v2/manage/ManageSectionRoute.tsx` ✓ (already wired into `AppRouter.tsx`)
- `client/src/features-v2/manage/*` ✓ (Manage feature module + mock adapter + tests)
- `server/application-v2/use-cases/manage/*` ✓ (Manage use-case + section builders + snapshots)
- `shared/contracts/manage-dashboard*.ts` ✓
- `docs/architecture/adr/ADR-016-manage-orchestrator-and-port-pattern.md` ✓
- Slice 21 manage report under `docs/review/manage-v2/` ✓
- Slice 20C global audit reports under `docs/review/global-audit-v2/slice-20c/` ✓
- 20B-FIX UI report under `docs/review/ui-v2/` ✓

## 5. Files risky to touch in Slice 22A

These files are central to other slices' contracts and must be edited surgically, never wholesale-replaced:

- `client/src/app-v2/AppRouter.tsx` — single source of route table; minimum-diff edits only.
- `client/src/app-v2/navigation/FloatingNav.tsx` — mobile nav contract; FAB behaviour is the explicit Slice 22A scope (Section C) so edits here are expected but must preserve a11y + test contract.
- `client/src/app-v2/navigation/DesktopSidebar.tsx` — sidebar contract relied on by AppShell.
- `client/src/features-v2/publishing/ComposerTrigger.tsx` — composer surface; do not refactor signature.
- `client/src/features-v2/feature-registry.ts` — status alignment (Section E) will touch but only widen precision, never downgrade real passes.
- `client/src/main.tsx` — single tsx entry; one-line edits only.
- `server/application-v2/use-cases/manage/*` — only mock adapter; do NOT replace with stub backends.
- `docs/governance/EXCEPTIONS_REGISTER.md` — modify only with explicit cause.

## 6. Confirmation: no changes discarded

- `git status --short` and `git diff --stat` were captured before any edit.
- `git stash list` shows one pre-existing audit stash (`stash@{0}`) that does **not** belong to this branch; left untouched.
- No `git reset`, `git checkout --`, `git clean`, or branch deletion has been or will be executed in Slice 22A.
- No `rm -rf` against untracked content has been executed.
- The local `ZIPY/` artefact directory (per user memory) is preserved.

## 7. Slice 22A working-rules summary

- Edit only files needed for the named sections (B–I).
- Never delete an untracked directory blindly; if it looks unused, document it in Section I instead.
- Every gate in Section J will run from this baseline so deltas are attributable.
- Final report (Section K) will cross-reference every changed file back to its section.

— End of pre-change inventory.
