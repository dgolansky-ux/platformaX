# content-v2 / friend-posts

**Status:** FOUNDATION_READY (in-memory store, no HTTP transport)
**Events:** OUTBOX_SKELETON — `FriendFeedPostCreated`,
`FriendFeedCommentCreated`, `FriendFeedReactionAdded` are built but not
delivered (no notifications UI / no outbox plumbing this slice).

Owns friend posts + friend-post comments + friend-post reactions. The
domain never imports `social` or `identity` — friendship verdicts and
author public summary enrichment are supplied by the application layer
through `FriendshipResolver` (here) and the use-case's identity wiring.

## Public surface

Import only from `public-api.ts`. Public DTOs:
- Drop nothing on the post (`authorUserId` is a stable id, not PII) but
  the comment public DTO replaces deleted bodies with `""` at the mapper
  boundary.
- Friend feed items also carry `viewerCanComment` / `viewerCanReact` so
  the UI can render disabled affordances without re-running policy.

## Out of scope this slice

- Notifications delivery (push / email / activity feed UI).
- Ranking / discovery / global feed.
- Comment threading beyond a flat list per post.
- Reaction set beyond `like` (legacy parity).
