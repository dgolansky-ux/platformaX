# features-v2/content-display — Post Display Kit (Slice 17)

Status: DISPLAY_KIT_READY

## What ships

- **Base components** (`PostDisplayKit.tsx`) — compound shell every variant
  reuses:
  - `PostDisplayRoot`, `PostDisplayHeader`, `PostAuthorSummary`,
  - `PostBody`, `PostMediaGrid`, `PostMeta`,
  - `PostActionBar`, `PostPrivacyBadge`, `PostRouteLink`, `PostBadgeRow`,
  - `PostSkeleton`, `PostErrorState`, `PostEmptyState`.
- **Variants** (`variants/PostCardVariants.tsx`) — one per surface:
  - `FriendFeedPostCard`, `CommunityFeedPostCard`, `StaffFeedPostCard`,
    `RelationalFeedPostCard`, `ChannelPostCard`,
  - `WorkplacePostCard` (full) + `WorkplaceTeaserCard` (compact, NO full body),
  - `ImportantEventCard` (date pill + title-led layout),
  - `ProfilePresentationCard` (editorial layout),
  - `CompactPostPreviewCard` (used in notifications / hover previews).

## Boundaries

- Display Kit consumes already-safe `PostDisplayViewModel` view models.
- Never re-checks permissions, never fetches anything, no `@server/*` imports.
- No fake counters: `interactionSummary` is optional; when absent the
  action bar still renders but counts are 0.
- Teaser variants never carry the full body — the source view model omits
  `bodyFull` for teasers and the variant only renders `bodyPreview`.
