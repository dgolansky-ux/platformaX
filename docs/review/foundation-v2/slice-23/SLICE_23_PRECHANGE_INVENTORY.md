# SLICE 23 — Pre-change Inventory

> **Date:** 2026-05-30
> **Purpose:** Capture the exact starting state of the working tree before
> any Slice 23 foundation-hardening edit, so we can prove nothing was
> deleted or rewritten blindly.

## 1. Branch / commit baseline

| Item | Value |
| --- | --- |
| Branch | `feat/contacts-v2-clean-room-slice` |
| HEAD SHA | `579e9ed6d04e6f8cc5fc2f6ad7d0105829350d2c` |
| HEAD short | `579e9ed` |
| HEAD subject | `chore(docs): refresh slice-22 audit package git-state captures after consolidation commit` |
| Working tree | **clean** (`git status --short` empty) |
| Last big slice | Slice 22A (commit `6b97735`) — stabilization, AppShell, route-aware FAB, audit ZIP. |

Recent commits (most recent first):
- `579e9ed` chore(docs): refresh slice-22 audit package git-state captures
- `6b97735` feat(v2): slice 22A — stabilization + AppShell + route-aware FAB + audit ZIP
- `9d8fc1c` feat(v2): slice 20B-21 — aggressive card visual polish
- `876f807` feat(v2): slice 20B-21 part 2 — composer trigger wired
- `0563cc8` fix(v2): friend-feed page rendering hidden behind fixed sidebar

## 2. Changed / untracked files

**None.** `git status --short` is empty. Slice 23 starts from a clean tree.

## 3. Files likely to be touched in Slice 23

### Section 3 — ProfilePage → AppShell
- `client/src/app-v2/profile/ProfilePage.tsx`
- `client/src/app-v2/profile/styles/profile-layout.module.css` (CSS-variable token cascade)
- New `client/src/app-v2/profile/ProfileTokensProvider.tsx` (or equivalent wrapper)
- `client/src/app-v2/navigation/AppShell.tsx` (only if it must accept a token slot)
- `client/src/app-v2/profile/__tests__/ProfilePage.test.tsx`
- `client/src/app-v2/profile/__tests__/ProfileRuntime.test.tsx`

### Section 4 — Playwright tooling
- `package.json` (devDependency + script `screenshots:v2`)
- `pnpm-lock.yaml`
- new `playwright.config.ts`
- new `tests/visual-v2/app-v2-screenshots.spec.ts`
- new `docs/review/visual-v2/slice-23/screenshots/*`
- new `docs/review/visual-v2/slice-23/SLICE_23_VISUAL_SCREENSHOT_REPORT.md`

### Section 5 — Knip / orphan cleanup
- Possibly empty `client/src/features-v2/{search,chat,events,audit,system,content-v2,notifications}/index.ts` if found genuinely unused.
- Decision register: new `docs/review/foundation-v2/slice-23/SLICE_23_KNIP_DEPCRUISE_ORPHAN_DECISION_REGISTER.md`.

### Section 7 — Code quality hardening
- Targeted small fixes only — no large refactors.

### Section 8 — UI truth cleanup
- Re-scan `client/src/**/*.{tsx,ts,css}` for user-visible debug / "Wkrótce" / "coming soon" / "fake" / "placeholder". Most were already cleaned in Slice 22A; only residual fixes expected.

### Section 11 — ZIP / manifest
- new `scripts/audit/create-slice-23-full-source-audit-zip.mjs`
- `ZIPY/` outputs are gitignored.

### Reports (foundation-v2/slice-23 + visual-v2/slice-23)
- `SLICE_23_PRECHANGE_INVENTORY.md` (this file)
- `SLICE_23_STATUS_TRUTH_RECONCILIATION.md`
- `SLICE_23_KNIP_DEPCRUISE_ORPHAN_DECISION_REGISTER.md`
- `SLICE_23_DOMAIN_BOUNDARY_RECHECK.md`
- `SLICE_23_CODE_QUALITY_HARDENING_REPORT.md`
- `SLICE_23_UI_TRUTH_CLEANUP_REPORT.md`
- `SLICE_23_SECURITY_PII_RECHECK.md`
- `SLICE_23_VISUAL_SCREENSHOT_REPORT.md`
- `SLICE_23_FOUNDATION_HARDENING_REPORT.md`

## 4. Current risks (before any change)

1. **CSS-variable cascade in profile**: `ProfilePage` relies on the `.page` class to root `--color-bg`, `--color-text`, `--gradient-primary`, etc. for every descendant in `client/src/app-v2/profile/sections/*` and `client/src/app-v2/profile/styles/*`. Moving the wrapper without preserving the cascade will visually break the profile page.
2. **Sticky topbar inside profile**: `ProfileTopBar` uses `position: sticky; top: 0` inside the existing `layout.shell` column. AppShell's `<main>` is a flex column already; sticky might still work but needs verification.
3. **Profile-specific FloatingNav `active="profil"`**: AppShell maps `profil → profil` so behavior is preserved if migrated correctly.
4. **Test fixtures**: `ProfilePage.test.tsx` and `ProfileRuntime.test.tsx` assert specific buttons/labels. Refactor must preserve those assertions.
5. **Playwright environment**: browser install may be blocked in the sandbox; if so, screenshots will be `ENV_BLOCKED` not faked.
6. **knip warnings**: 90+ unused exports listed. Many are intentional public-API exports for cross-feature import; removing them would break consumers. Decisions must be made per-export.

## 5. Confirmation: no work discarded

- Pre-change `git status --short` was empty — no uncommitted changes existed at the start of Slice 23.
- No `git reset`, `git checkout --`, `git clean`, or branch deletion has been or will be executed.
- No `rm -rf` against untracked content has been executed.
- The local `ZIPY/` directory (per user memory) is gitignored and preserved.

— End of Slice 23 pre-change inventory.
