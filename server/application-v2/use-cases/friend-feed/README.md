# application-v2/use-cases/friend-feed

**Status:** BACKEND_PARTIAL (in-memory wiring, no HTTP transport).

Orchestrates the friend feed product flow. The use-case:
- consumes the friendship graph from `social.public-api.SocialContactsService`,
- consumes friend post / comment / reaction data from
  `content-v2.public-api` (`FriendPostsService`),
- enriches authors with `identity.public-api.getPublicProfile`,
- emits no PII in any DTO.

## Methods

- `createFriendFeedPost`
- `updateOwnFriendPost`
- `deactivateOwnFriendPost`
- `listFriendFeed` (cursor, bounded by `FRIEND_FEED_MAX_LIMIT`)
- `getPersonalProfileFriendFeedPreview` (owner / friend / stranger)
- `getFriendFeedComposerState`
- `createFriendPostComment`
- `listFriendPostComments`
- `updateOwnFriendPostComment`
- `deactivateOwnFriendPostComment`
- `reactToFriendPost`
- `reactToFriendPostComment`
- `getFriendFeedInteractionSummary`

## Out of scope

- Notifications delivery (outbox / push / email).
- Global feed / discovery / ranking.
- Mixing community posts into the friend feed.
