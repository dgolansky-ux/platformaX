# HAND008 — Communities MVP + Slice 1 (RESOLVED)

**Status:** READY_FOR_PRODUCT_REVIEW. Communities MVP + Slice 1 są zakończone,
zacommitowane i wypchnięte na branch.

**Branch:** `feat/contacts-v2-clean-room-slice`  
**Resolved commit:** `a5823fd` (`feat(v2): communities MVP + slice 1 (list, cards, 4-step wizard) clean-room`)  
**Worktree at close:** clean, tracking `origin/feat/contacts-v2-clean-room-slice`

## Delivered Scope

- Backend `communities-v2`: join-request lifecycle, member listing, role changes,
  public lookup by slug, viewer role, pending join requests, category reference
  data and category filtering.
- Application layer: `enableCommunityModule` use-case with community authority
  check.
- Shared contracts: communities core/actions split, category/list/create fields.
- Frontend `features-v2/communities-v2`: MOCK_LOCAL_ONLY in-memory adapter,
  `/communities` list, 1:1 card variants, search/filter sections, profile/manage
  shells, modules/channels/hub shells, and 4-step create community wizard.
- Routing: `/communities`, `/communities/new`, `/communities/:slug`,
  `/communities/:slug/manage`, `/communities/:slug/manage/modules`,
  `/communities/:slug/channels`, `/communities/:slug/hub`.
- Reports and status truth updated:
  `docs/review/communities-mvp-product-slice/REPORT.md`,
  `docs/review/communities-v2/SLICE_1_LIST_AND_CREATE_REPORT.md`,
  `docs/review/communities-v2/LEGACY_COMMUNITIES_SLICE_1_UI_MAP.md`,
  `docs/review/REVIEW_REPORTS_INDEX.md`,
  `docs/governance/DOMAIN_STATUS_REGISTRY.yml`.

## Evidence

- `pnpm check` — PASS.
- `pnpm lint` — PASS.
- `pnpm test` — PASS (`733/733` in the slice report evidence).
- `pnpm build` — PASS.
- `pnpm rules:check` — PASS.
- `pnpm arch:check:v2` — PASS.
- `pnpm guards:all-local` — PASS (`24/25`, branch protection remains external).

Detailed evidence lives in:

- `docs/review/communities-mvp-product-slice/REPORT.md`
- `docs/review/communities-v2/SLICE_1_LIST_AND_CREATE_REPORT.md`

## Remaining Product Risk

- HTTP transport is still absent; frontend remains `MOCK_LOCAL_ONLY`.
- Persistence remains in-memory; Supabase/DB adapter is future work.
- The frontend adapter duplicates the category catalog until a shared catalog
  source is introduced.
- Wizard Step 3 omits legacy `locationHq`; documented as a minor P2 gap in the
  Slice 1 report.

## Recommended Next Slice

Community Slice 2: full community profile visual parity plus join/request flow
(`request join` -> manager accepts -> member state), member badges and
visibility-aware controls.
