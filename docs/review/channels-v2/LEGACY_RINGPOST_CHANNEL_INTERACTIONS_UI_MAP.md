# Legacy RingPost / Channel Interactions UI Map

Status: `ACTIVE_EVIDENCE` · clean-room inventory for Channels Slice 9.

## Reviewed Source Material

- Prior channel content inventory: `docs/review/channels-v2/LEGACY_RINGPOST_CHANNEL_CONTENT_UI_MAP.md`.
- Community interaction inventory: `docs/review/communities-v2/LEGACY_COMMUNITIES_SLICE_6_COMMENTS_REACTIONS_UI_MAP.md`.
- V2 community interaction UI used as local pattern reference:
  `client/src/features-v2/communities-v2/feeds/interactions/`.
- Existing V2 channel feed/card shell:
  `client/src/features-v2/channels/ChannelPostCard.tsx`,
  `client/src/features-v2/channels/ChannelProfileShell.tsx`.

## Legacy Behavior Map

- Comments: simple flat thread below a post; author row, body, timestamp, empty
  and loading/error states. Deep threading is not required for this slice.
- Reactions: lightweight `like`-style action under content; count beside action.
- Action bar: small controls below a post body, not a dominant toolbar.
- Counters: visible near the action controls; should be real counts, not seeded
  display-only values.
- Settings: no reliable clean-room runtime setting was reused. V2 owns explicit
  channel interaction settings.
- Moderation: legacy inspiration is discreet hide/delete action; V2 enforces
  lead permission before moderating.

## Clean-Room V2 Mapping

| Legacy intent | V2 implementation |
|---|---|
| Comment thread under RingPost item | `content-v2/channel-comments` + `ChannelCommentsList` |
| Like action | `content-v2/channel-reactions` + `ChannelReactionButton` |
| Action bar under post | `ChannelPostActionBar` |
| Visible counts | repository batch counts + frontend DTO counts |
| Hidden/deleted comment state | `status="deactivated"` with empty body |
| Lead moderation | `moderate_channel_comments` policy in `channels` |
| Interaction controls | `ChannelInteractionSettingsPanel` |

## Rejected

- Legacy runtime, tRPC, old hooks, router coupling and Supabase coupling.
- Fake counters, fake save, no-op mutations and optimistic-only persistence.
- localStorage/sessionStorage as backend.
- PII in DTOs, raw records and private contact fields.
- Storing channel comments/reactions in `channels`.
- Storing channel leads, follows or permissions in `content-v2`.
- Chat, newsletter, notifications, ranking and global feed behavior.
