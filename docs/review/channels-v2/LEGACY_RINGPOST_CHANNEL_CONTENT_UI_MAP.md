# Legacy RingPost / Channel Content UI Map

Status: `ACTIVE_EVIDENCE` · clean-room inventory for Channels Slice 8.

## Reviewed Source Material

- Legacy RingPost concept from `Starykod-4-extracted/PlatformaX/` notes and
  existing channel/community UI inventory.
- Existing V2 scaffolds: `/channels`, `/channels/:slug`, channel cards, leads
  panel, community feed/comment slices.

## Legacy Behavior

- RingPost acted like one channel-like communication surface attached to a
  community.
- Posts were visually simple: author row, body, time, optional highlighted state.
- Composer was embedded near the top of the channel/community surface.
- Empty states were text-first; loading/error states were local UI states.
- Important/pinned content existed conceptually as a highlighted top item, but
  legacy mixed it with runtime coupling and optimistic UI.

## Clean-Room V2 Mapping

| Legacy intent | V2 implementation |
|---|---|
| RingPost stream | `content-v2/channel-posts` owned feed |
| Composer | `ChannelPostComposer` visible only to permitted leads |
| Post card | `ChannelPostCard` with author summary, body, time, pin action |
| Important post | one active pinned post per channel |
| Channel page feed | `ChannelFeedList` under `ChannelProfileShell` |
| Directory activity hint | real latest post preview on `/channels` cards |

## Rejected

- tRPC/Supabase coupling and legacy hooks.
- localStorage/sessionStorage cache.
- fake counters/latest activity.
- no-op composer or optimistic fake save.
- comments, reactions, chat, newsletter, notifications, ranking.
- PII in post/author DTOs.
- Storing channel posts in `channels`; posts belong to `content-v2`.
