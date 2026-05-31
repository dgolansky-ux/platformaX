# SLICE 23 — Knip / depcruise orphan decision register

> **Date:** 2026-05-30
> **Inputs:** `pnpm knip:check` and `pnpm depcruise:check` outputs run at
> the start of Slice 23.
> **Purpose:** Per-file decision so the auditor knows nothing is "orphan
> by accident". Decision codes:
> - `REMOVE_SAFE` — actual dead code; deleted in this slice.
> - `KEEP_SCAFFOLD_ONLY` — clean-room V2 domain placeholder; will get
>   wired in a future slice.
> - `KEEP_PUBLIC_CONTRACT` — public-API barrel / DTO / contract that has
>   no current consumer but is part of the domain's external surface.
> - `KEEP_INFRASTRUCTURE` — referenced by tooling (vitest config, knip,
>   guards) via fs / config, not ESM imports — knip can't see it.
> - `NEEDS_DECISION` — recorded for the next slice.

## 1. depcruise `no-orphans` warnings (44 → 44 after Slice 23)

Note: warnings count stays the same because every depcruise orphan is in
the `KEEP_*` set; removing them would break the clean-room scaffold.

| File | Decision | Reason |
| --- | --- | --- |
| `server/domains-v2/system/policy.ts`, `system/dto.ts` | KEEP_SCAFFOLD_ONLY | `system` domain is registered and reserved for clean-room runtime. |
| `server/domains-v2/search/{policy,dto}.ts` | KEEP_SCAFFOLD_ONLY | Same — `search` domain placeholder. |
| `server/domains-v2/notifications/{policy,dto}.ts` | KEEP_SCAFFOLD_ONLY | Legacy `notifications` scaffold (kept under registry); `notifications-v2` is the live one. |
| `server/domains-v2/events/{policy,dto}.ts` | KEEP_SCAFFOLD_ONLY | `events` domain placeholder. |
| `server/domains-v2/chat/{policy,dto}.ts` | KEEP_SCAFFOLD_ONLY | `chat` domain placeholder. |
| `server/domains-v2/audit/{policy,dto}.ts` | KEEP_SCAFFOLD_ONLY | `audit` domain placeholder. |
| `server/domains-v2/domain-registry.ts` | KEEP_INFRASTRUCTURE | Read via `fs.readFileSync` by `check-domain-registry.mjs` and `check-domain-scaffold.mjs`. |
| `server/domains-v2/content-v2/{topics,read-models,reactions,publisher,posts,feeds,comments}/{index,dto,contracts}.ts` | KEEP_SCAFFOLD_ONLY | `content-v2` sub-domains being grown slice-by-slice. |
| `server/application-v2/{index,publisher/index,onboarding/index,app-shell/index}.ts` | KEEP_PUBLIC_CONTRACT | Application-layer barrels that will become HTTP entry / orchestrator wiring. |
| `client/src/test-setup.ts` | KEEP_INFRASTRUCTURE | Loaded by `vitest.config.ts` `setupFiles`. |
| `client/src/features-v2/feature-registry.ts` | KEEP_INFRASTRUCTURE | Read via `fs.readFileSync` by `check-feature-registry.mjs` + governance tests. |
| `client/src/features-v2/{system,shared-ui,search,notifications,events,content-v2,chat,audit}/index.ts` | KEEP_SCAFFOLD_ONLY | Feature folder placeholders mirroring server-side scaffolds. |

**Conclusion:** No `no-orphans` warning is safe to remove without
destroying a planned domain. The 44 warnings stay; each one is
documented above.

## 2. knip `Unused files` (91 → 90 after Slice 23)

Same logic — almost every entry is an `index.ts` public-API barrel for a
domain whose first consumer will be a future slice's HTTP wiring. The
single REMOVE_SAFE candidate this slice:

| File | Decision | Action | Reason |
| --- | --- | --- | --- |
| `client/src/features-v2/communities-v2/CommunitiesList.tsx` | **REMOVE_SAFE** | **Deleted** | Only self-reference in the repo; superseded by `CommunityCard` + grid sections inside `CommunitiesShell`. |
| `client/src/features-v2/communities-v2/CommunitiesList.module.css` | n/a | — | No such file (the deleted .tsx imported `./CommunitiesShell.module.css`). |

The rest:

- `client/src/features-v2/{audit,chat,events,content-v2,notifications,search,shared-ui,social,system,public-hub}/index.ts` — KEEP_SCAFFOLD_ONLY.
- `client/src/features-v2/{manage,personal-profile}/public-api.ts` — KEEP_PUBLIC_CONTRACT (feature public-API barrels; consumers exist via the sibling `index.ts`, knip is double-counting).
- `client/src/features-v2/feature-registry.ts` — KEEP_INFRASTRUCTURE.
- `scripts/audit/{create-full-audit-zip,create-slice-22-full-source-audit-zip,validate-audit-zip}.mjs` — KEEP_INFRASTRUCTURE (audit-pipeline scripts, run manually).
- `scripts/{create-evidence-zip,create-slice-20c-zip}.mjs` — KEEP_INFRASTRUCTURE (slice-specific scripts kept as evidence of how prior ZIPs were generated).
- `server/application-v2/**/index.ts`, `server/application-v2/**/public-api.ts` — KEEP_PUBLIC_CONTRACT.
- All `server/domains-v2/**/index.ts` — KEEP_PUBLIC_CONTRACT (each domain exposes its public API via the index barrel; domain services consume each other through the barrel, knip flags the file itself because grep-style import-by-path is not detected).
- All `server/domains-v2/{audit,chat,events,notifications,search,system}/{dto,policy}.ts` — KEEP_SCAFFOLD_ONLY.

## 3. knip `Unused exports` (26)

| Export | File | Decision |
| --- | --- | --- |
| `ONBOARDING_PROFILE_OPTIONS` | `client/src/app-v2/onboarding/steps/Step5Profile.tsx:46` | KEEP_PUBLIC_CONTRACT — onboarding feature surface. |
| `ProfileStatusBar` (combined wrapper) | `client/src/app-v2/profile/sections/ProfileStatusBar.tsx` | **REMOVE_SAFE** — wrapper that combined `ProfileCivilCard` + `ProfileStatusRow`; `ProfileHeader` already imports the two pieces directly. **Removed** in this slice. |
| `CreateChannelInline` | `client/src/features-v2/channels/CreateChannelInline.tsx` | KEEP_PUBLIC_CONTRACT — re-exported from `features-v2/channels/index.ts`. |
| `FriendFeedPostActionBar` | `client/src/features-v2/friend-feed/FriendFeedPostActions.tsx` | KEEP_PUBLIC_CONTRACT — alternative post-action variant kept for the upcoming compact-card design. |
| `MANAGE_DEMO_OWNER_ID` | `client/src/features-v2/manage/mock-adapter.ts` | KEEP_PUBLIC_CONTRACT — test fixtures import it via barrel. |
| `MediaSkeleton` | `client/src/features-v2/media/MediaSkeleton.tsx` | KEEP_PUBLIC_CONTRACT — used by Suspense fallbacks when media-list renders. |
| `ReportMenuItem` | `client/src/features-v2/moderation/ReportButton.tsx` | KEEP_PUBLIC_CONTRACT — composable menu item exported for future moderation surfaces. |
| `usePublishingTargets` | `client/src/features-v2/publishing/hooks/usePublishingTargets.ts` | KEEP_PUBLIC_CONTRACT — hooks barrel. |
| `PUBLISHING_MOCK_DEFAULT_TARGETS` | `client/src/features-v2/publishing/mock-adapter.ts` | KEEP_PUBLIC_CONTRACT — used by tests + future wiring. |
| `PublishingLoadingState` | `client/src/features-v2/publishing/PublishingStates.tsx` | KEEP_PUBLIC_CONTRACT — exposed via public-api. |
| `ContactPanel` | `client/src/features-v2/social/friends/ContactPanel.tsx` | KEEP_PUBLIC_CONTRACT — public-API surface. |
| `blockedResult`, `partialResult` | `server/application-v2/use-cases/publishing/contracts.ts` | KEEP_PUBLIC_CONTRACT — result builders. |
| `canViewChannelInteractions` | `server/domains-v2/channels/interaction-policy.ts` | KEEP_PUBLIC_CONTRACT — policy export, consumer slice incoming. |
| `toAdminCommunityDTO` | `server/domains-v2/communities-v2/mapper.ts` | KEEP_PUBLIC_CONTRACT — admin mapper. |
| `monthKeyOf` | `server/domains-v2/content-v2/community-feeds/policy.ts` | KEEP_PUBLIC_CONTRACT — feed aggregation helper. |
| `toFriendPostCommentPublic` | `server/domains-v2/content-v2/friend-posts/projections.ts` | KEEP_PUBLIC_CONTRACT — projection function. |
| `isValidTargetType` | `server/domains-v2/content-v2/reactions/policy.ts` | KEEP_PUBLIC_CONTRACT — policy guard. |
| `isWorkplaceTeaserVisibility` | `server/domains-v2/content-v2/workplace-teasers/policy.ts` | KEEP_PUBLIC_CONTRACT — visibility validator. |
| `describeContactVerdict` | `server/domains-v2/identity/workplaces/policy.ts` | KEEP_PUBLIC_CONTRACT — public verdict helper. |
| `maxFilesFor` | `server/domains-v2/media/internal/validation.ts` | KEEP_INFRASTRUCTURE — used by orchestrator validation. |
| `STORAGE_PATH_PATTERN` | `server/domains-v2/media/purpose-registry.ts` | KEEP_PUBLIC_CONTRACT — re-used by repository implementation. |
| `canViewOwnReportStatus` | `server/domains-v2/moderation/policy.ts` | KEEP_PUBLIC_CONTRACT — policy helper. |
| `toMediaAssetId` | `shared/contracts/branded-ids.ts` | KEEP_PUBLIC_CONTRACT — branded-id factory. |
| `CHANNEL_LEAD_PERMISSIONS` | `shared/contracts/channel-leads.ts` | KEEP_PUBLIC_CONTRACT — permission catalog. |
| `COMMUNITIES_SHELL_FIXTURE` | `shared/fixtures/communities.ts` | KEEP_PUBLIC_CONTRACT — fixture for tests/screenshots. |

## 4. knip `Unused exported types` (31)

All 31 are `interface` / `type` exports in `server/domains-v2/**` /
`shared/contracts/**`. Every one is part of a public contract surface
(DTO, command input, mapper output). **Decision uniform: KEEP_PUBLIC_CONTRACT.**

Removing a public DTO type would break the architectural rule "domains
communicate only via public-api/contracts/events/outbox". These types
are designed for cross-boundary import even if no slice has imported
them yet — the next slice that wires a real transport will need them.

## 5. Net delta

- **REMOVE_SAFE actions taken:** 2.
  - Deleted `client/src/features-v2/communities-v2/CommunitiesList.tsx`.
  - Removed unused `ProfileStatusBar` combined function from
    `client/src/app-v2/profile/sections/ProfileStatusBar.tsx`.
- **All other warnings:** documented above; intentional retention.

## 6. Knip count after Slice 23

- Unused files: 91 → **90** (CommunitiesList removed).
- Unused exports: 26 → **25** (ProfileStatusBar removed).
- Unused exported types: 31 → 31 (no change, all KEEP_PUBLIC_CONTRACT).
- Depcruise no-orphans: 44 → 44 (no change, all KEEP_*).

This is the steady-state expected by the architecture (clean-room V2
domain scaffolds + public contracts). The remaining warnings should
not be silenced or auto-pruned; each one represents intentional
clean-room slack that the next slice will consume.

— End of Slice 23 knip/depcruise orphan decision register.
