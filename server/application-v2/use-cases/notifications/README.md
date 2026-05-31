# application-v2/use-cases/notifications

Status: `BACKEND_PARTIAL` (Slice 14)

## Purpose

Subscribes product domain events to `notifications-v2`. Provides typed
`handle*` functions that turn upstream events (e.g. `FriendFeedCommentCreated`)
into a `notifications-v2.createNotification(...)` call with PII-free titles +
body previews + a notification source-ref + a dedupeKey == event id.

## Today

Wired (real source events exist):

- `handleFriendFeedCommentCreated`
- `handleFriendFeedReactionAdded`
- `handleFriendFeedCommentReactionAdded`

The full registry of intended handlers (communities, channels, modules,
professional) lives at
[`server/domains-v2/notifications-v2/event-registry.ts`](../../../domains-v2/notifications-v2/event-registry.ts).
Each entry whose status is `blocked_by_missing_source_event` reflects that the
source domain has not yet emitted the event; we deliberately do NOT add fake
handlers — `event-registry` + tests fail loudly when entries are malformed.

## Rules

- actor === recipient → skipped (notifications-v2 short-circuits this).
- dedupe → `event.eventId` is reused so retries do not duplicate.
- settings → notifications-v2 owns the per-category in-app gate.
- no PII → titles + body previews are short, generic, and reference no email /
  phone / raw post body.

## Boundaries

- imports only `@server/domains-v2/content-v2/public-api` (event types) and
  `@server/domains-v2/notifications-v2/public-api` (service contract);
- never imports source-domain internals (`/service`, `/repository`, `/policy`,
  etc.).
