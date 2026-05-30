# Channels Slice 9 — Interactions

Branch: `feat/contacts-v2-clean-room-slice` · Status: `READY_FOR_PRODUCT_REVIEW`

## Legacy RingPost Inventory

Reviewed:

- `docs/review/channels-v2/LEGACY_RINGPOST_CHANNEL_CONTENT_UI_MAP.md`
- `docs/review/communities-v2/LEGACY_COMMUNITIES_SLICE_6_COMMENTS_REACTIONS_UI_MAP.md`
- `client/src/features-v2/communities-v2/feeds/interactions/`
- `client/src/features-v2/channels/ChannelPostCard.tsx`
- `client/src/features-v2/channels/ChannelProfileShell.tsx`

Used as visual/product inspiration: subtle action bar, flat comments, small like
button, comment/reaction counters, empty/loading/error states, discreet
moderation actions.

Rejected: legacy runtime, tRPC, old hooks, Supabase coupling, fake counters,
fake save, no-op mutations, localStorage/sessionStorage backend, PII leaks,
spaghetti UI and storing interactions in `channels`.

## Model

Comments live in `content-v2/channel-comments`: flat comment model with
`active` / `edited` / `deactivated`, author-only edit, soft deactivate, moderator
deactivate metadata, cursor listing and batch active counts. Deactivated
comments expose an empty body in DTOs.

Reactions live in `content-v2/channel-reactions`: `like` only for now, targeting
`channel_post` or `channel_comment`. `set` is idempotent, `remove` removes, and
`toggle` flips state. Summaries and viewer state are batched.

Interaction settings live in `channels`: comments enabled, reactions enabled,
comment policy (`followers`, `community_members`, `leads_only`), moderation
policy and lead permissions `moderate_channel_comments` /
`manage_channel_interactions`.

`application-v2/use-cases/channel-interactions` orchestrates access using public
APIs only: channel visibility/follow/lead permissions from `channels`, owner
community membership from `communities-v2`, post/comment/reaction persistence
from `content-v2`, and public author summaries from `identity`.

## Frontend

`ChannelPostActionBar` adds lightweight reaction and comments controls under
channel posts. The comment panel includes loading, error, empty, permission,
composer, item and moderation states. `ChannelInteractionSettingsPanel` is shown
only when the viewer can manage interactions. The local adapter is
`MOCK_LOCAL_ONLY` but mutates an in-memory store, so there are no fake counters
or fake saves.

## Status Notes

- `BACKEND_PARTIAL`: in-memory repositories/services and migration draft exist;
  no DB adapter or HTTP transport.
- `TRANSPORT_PARTIAL`: frontend still uses `channelsMockAdapter`.
- `READ_MODEL_SKELETON`: batch count methods exist; DB read model table is only
  drafted.

Not implemented: chat, newsletter, notifications, ranking, full discovery,
global feed, payments, events and full audit ZIP.

## Test Evidence

- `pnpm check` — PASS
- `pnpm lint` — PASS
- `pnpm test` — PASS: 942/942
- `pnpm build` — PASS (Vite chunk-size warning only)
- Targeted Slice 9 vitest — PASS: 39/39 before extra UI assertions
- `ChannelProfileShell` updated UI tests — PASS: 6/6

Coverage includes: settings permission, disabled comments/reactions, followers
policy, community members policy, leads-only policy, moderation permission,
private channel denial, deactivated body hidden, DTO no PII, reaction duplicate
dedupe/toggle, batch counts and viewer state.

## Guard Evidence

- `pnpm rules:check` — PASS
- `pnpm arch:check:v2` — PASS
- `pnpm guards:all-local` — PASS
- `pnpm depcruise:check` — PASS with existing no-orphans warnings, 0 errors
- `pnpm secrets:gitleaks` — NOT_AVAILABLE / skipped because gitleaks binary is
  not installed; repo secret scanners in `guards:all-local` passed.
- `pnpm tooling:redcase` — PASS after generating/removing temporary redcase
  artifacts.

## P0/P1/P2

- P0: none known after targeted tests.
- P1: none known after targeted tests.
- P2: HTTP/DB transport pending; channel interaction count read model is a
  schema skeleton; mock adapter is local-only until transport slice.

## Next Steps

1. Add HTTP/DB adapter for channel interactions.
2. Wire real transport into frontend.
3. Decide whether comment replies are needed after product review.
