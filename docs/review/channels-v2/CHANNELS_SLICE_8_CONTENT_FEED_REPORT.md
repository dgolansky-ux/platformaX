# Channels Slice 8 — Channel Content Feed

Branch: `feat/contacts-v2-clean-room-slice` · Status: `READY_FOR_PRODUCT_REVIEW`

## Summary

Channels now have a real V2 communication path: permitted channel leads can
publish posts, a channel page renders a feed, one post can be pinned, and
`/channels` cards show real latest-post previews when available.

## Legacy Inventory

Clean-room inventory: `docs/review/channels-v2/LEGACY_RINGPOST_CHANNEL_CONTENT_UI_MAP.md`.

Used as inspiration: post card hierarchy, composer near channel hero, highlighted
important post, lightweight empty/loading/error states.

Rejected: legacy runtime, tRPC, Supabase coupling, hooks, localStorage cache,
fake counts, fake save, comments/reactions/chat/newsletter/notifications/ranking.

## Architecture

- `channels` owns channel definitions, follows, leads and lead permissions:
  `publish_channel_content`, `manage_channel_content`, `pin_channel_post`,
  `manage_channel_leads`, `manage_channel_profile`, `view_channel_stats`.
- `content-v2/channel-posts` owns channel posts, feed ordering, soft
  deactivation and one active pinned post per channel.
- `server/application-v2/use-cases/channel-content` orchestrates channel
  permissions + content writes + identity author summaries.
- Frontend uses `channelsMockAdapter` only; no `@server/*` imports and no fake
  persistence claim.

## Product Behavior

- Only an active channel lead with `publish_channel_content` can publish.
- Community founder/admin does not automatically publish unless they are a
  channel lead with the permission.
- Author can edit/deactivate own post through content policy; a lead with
  `manage_channel_content` can manage other posts.
- A lead with `pin_channel_post` can pin/unpin; pinning clears the previous
  active pinned post.
- Feed order is pinned first, then `createdAt desc` with `id` tie-breaker.
- Private channel feed access is policy-gated; public channel feed is readable.
- Pinned post is rendered as a highlighted top card and omitted from the regular
  list to avoid duplicate visual noise.

## Persistence

Added migration draft: `supabase/migrations/0006_content_channel_posts.sql`.
No `db push` was run. Runtime remains in-memory (`BACKEND_PARTIAL` /
`TRANSPORT_PARTIAL`).

## Test Evidence

- `server/domains-v2/content-v2/channel-posts/__tests__/channel-post-service.test.ts`
  covers create/update/deactivate/list/pin/PII-safe DTO.
- `server/application-v2/use-cases/channel-content/__tests__/service.test.ts`
  covers lead publish permission, co-lead denial, community-admin denial,
  manage/pin permissions, private feed restriction and page view.
- `client/src/features-v2/channels/__tests__/ChannelProfileShell.test.tsx`
  covers feed render, composer publish, pin action and follower/no-composer
  state.
- `client/src/features-v2/channels/__tests__/ChannelsShell.test.tsx`
  covers real latest-post preview.

Targeted run: `17/17` tests PASS.

## Guard Evidence

Initial targeted gates passed:

- `pnpm check` — PASS
- targeted `vitest run ...channel content...` — PASS (`17/17`)

Final full gates are recorded in the final agent response for the commit.

## Not Implemented

- Comments and reactions.
- Chat, newsletter, notifications, events.
- Discovery ranking/global feed.
- HTTP transport/DB adapter beyond migration draft.
- Full audit ZIP.

## P0/P1/P2

- P0: none.
- P1: none after full gates pass.
- P2: HTTP transport absent; in-memory adapter duplicates demo author/channel
  summaries; media refs are supported as refs only, no upload UI in this slice.

## Next Step

Slice 9: channel comments/reactions or HTTP transport for channels/content,
depending on product priority.
