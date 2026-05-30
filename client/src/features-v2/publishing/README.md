# features-v2/publishing — Slice 17

Status: PUBLISHING_CORE_READY (FOUNDATION_READY for friend_feed / community_* /
channel / workplace; TARGET_PARTIAL for important_event and
profile_presentation until those domains land in V2).

## What ships

- **`PublishingComposerCore`** — shared shell every composer variant
  consumes (target, visibility, body, media, preview, submit, states).
- **Composer variants** — one file per surface, each with its own placeholder,
  title, micro-copy and accent (`FriendFeedComposer`, `CommunityFeedComposer`,
  `StaffFeedComposer`, `RelationalFeedComposer`, `ChannelComposer`,
  `WorkplaceComposer`, `ImportantEventComposer`, `ProfilePresentationComposer`).
- **Hooks** — `usePublishingTargets`, `usePublishingPreview`,
  `usePublishCommand`. Each owns one concern. The publish hook generates a
  per-attempt `idempotencyKey` so the server can dedupe.
- **`mock-adapter.ts`** — MOCK_LOCAL_ONLY transport. No `@server/*`, no
  `localStorage`. Mirrors the dispatcher's contract (idempotency cache,
  truthful partial envelopes for backend-not-ready targets).

## Boundaries

- No `@server/*` imports anywhere. UI types in `types.ts` mirror the server
  view DTOs.
- Media via `mediaRefs` only. The `PublishingMediaPicker` displays a
  truthful "media w przygotowaniu" state when the upload runtime is partial
  rather than pretending to upload.
- No `window.alert` / `window.confirm`. Errors render inline.
- No fake save: every submit goes through the adapter, which itself returns
  a real shaped envelope.
