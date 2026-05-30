# Friend Feed Slice 13 — Comments, Reactions, Event Hooks

Status: `READY_FOR_PRODUCT_REVIEW` if gates pass.

## Legacy Files Reviewed

- `docs/review/friend-feed-v2/LEGACY_FRIEND_FEED_UI_MAP.md`
- `client/src/features-v2/friend-feed/*`
- `client/src/features-v2/communities-v2/feeds/interactions/*`
- `client/src/features-v2/channels/ChannelPostInteractions.tsx`
- `client/src/features-v2/channels/ChannelCommentComponents.tsx`

## Visual Carry-Over

- Subtle pill action bar.
- `Polub` / `Lubię to` toggle and counts.
- `Komentarze · N` collapsed toggle.
- Rounded comment rows, compact composer, friendly empty/permission copy.
- Mobile-friendly wrapped actions.

## Legacy Runtime Rejected

- No tRPC/Supabase coupling.
- No legacy hooks.
- No `localStorage` / `sessionStorage` backend.
- No fake save/counters.
- No raw records or private contact fields.

## Comment Model

`content-v2/friend-posts` owns friend-post comments: create, edit own, deactivate own, list with cursor/fixed cap. Comment statuses are `active`, `edited`, `deactivated`; deactivated bodies are stripped from public views.

## Reaction Model

Friend feed reactions use `like` only. Targets are `friend_post` and `friend_post_comment`. Set/remove/toggle are deduped through the repository. Counts and viewer state are returned in interaction summaries.

## Counts / Batch

Post summaries include:
- `commentCount`
- post `likeCount`
- `viewerLiked`

The service exposes batch summary for feed pages; the in-memory adapter is marked `READ_MODEL_SKELETON`.

## Visibility

- `friends_only`: author + confirmed friends.
- `private`: author only.
- `public`: visible publicly, but commenting/reaction defaults to owner/friends only.
- Stranger cannot list comments, comment, react, or read private/friends-only interactions.

## Event Hooks

Typed event skeletons:
- `FriendFeedCommentCreated`
- `FriendFeedReactionAdded`
- `FriendFeedCommentReactionAdded`
- `FriendFeedCommentUpdated`
- `FriendFeedCommentDeleted`

Events carry ids only: no email, phone, names, body, or contact fields. Actor-recipient self notifications are skipped.

## Notification Registry Draft

See `docs/review/notifications-v2/NOTIFICATION_EVENT_REGISTRY_DRAFT.md`. This is mapping only; no notification center/runtime/UI exists.

## Partial Status

- `BACKEND_PARTIAL`: in-memory repositories, DB adapter pending.
- `TRANSPORT_PARTIAL`: no HTTP/API transport wired for Slice 13.
- `UI_SHELL_ONLY`: frontend uses mock adapter, no backend transport.
- `OUTBOX_SKELETON`: events publish through a publisher port, no durable outbox.

## Not Implemented

- Notifications UI.
- Email/push notifications.
- Global feed.
- Ranking/discovery.
- Chat.
- Full audit ZIP.

## Test Evidence

Targeted tests added/updated for:
- create/update/deactivate/list comments,
- reaction toggle/set dedupe,
- comment reactions,
- batch interaction summary,
- stranger denied,
- private/friends-only visibility,
- PII-safe DTOs/events,
- frontend action bar/comment states.

## Guard Evidence

To be filled by final gate run:
- `pnpm check`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm rules:check`
- `pnpm arch:check:v2`
- `pnpm guards:all-local`

## P0 / P1 / P2

- P0: none known before final gates.
- P1: transport remains partial by design.
- P2: DB adapter/read model and notifications activity center are next steps.

## Next Recommended Step

Notifications and Activity Center: attach this event registry draft to a durable outbox and notification read model.
