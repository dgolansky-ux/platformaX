# content-v2

Status: `PARTIAL` (BACKEND_PARTIAL / READ_MODEL_SKELETON)
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

## Purpose

Content domain for PlatformaX V2. Owns all content-related data and read models.

### community-feeds (Slice 5, BACKEND_PARTIAL)

`community-feeds/` adds community posts + per-community feed items for the three
feeds (`community_all` / `relational` / `staff_only`) with idempotent dedupe,
cursor read model and relational monthly count. Exposed via `public-api.ts`
(`createCommunityFeedService`, in-memory repos, `CommunityFeedItemDTO`, …).
Owns posts/feed items only — never membership/roles (those stay in
communities-v2; authority is enforced by application-v2/use-cases/community-feeds).

### channel-posts (Channels Slice 8, BACKEND_PARTIAL)

`channel-posts/` owns channel posts, channel feed ordering, soft deactivation
and one active pinned post per channel. It does not own channel leads,
permissions or follow state; those remain in `channels` and are enforced by
`application-v2/use-cases/channel-content`.

## Implemented (BACKEND_PARTIAL)

In-memory runtime foundation for posts + friend feed read model:

- `dto.ts` — `PostVisibility` (private|friends|public), `PostStatus`,
  `PostContextType` (profile_presentation|friend_post), `PostPublicDTO`,
  `FriendFeedItemDTO`, `CreatePostInput`, `FriendFeedQuery`. Public DTO, no PII.
- `policy.ts` — `canSeePost(post, viewerUserId, isFriend)` (public→all,
  friends→owner|friend, private→owner), `bodyPreview` (PREVIEW_MAX=280).
- `ports.ts` — `PostRepository` with `listByAuthors(authorUserIds, cursor, limit)`:
  a **scoped** read model. There is **no whole-table / global feed query**.
- `store.ts` — in-memory `PostRepository`, stable order (createdAt desc, id tiebreak).
- `service.ts` — `createContentService`: `createPost` (EMPTY_BODY guard),
  `listFriendFeed` (cursor + DEFAULT_LIMIT 20 / MAX_LIMIT 50, `canSeePost` filter).

### READ_MODEL_SKELETON

The friend feed is a **single-owner read-model skeleton**: the feed is composed
by querying an explicit set of `authorUserIds` (the viewer's friends, resolved by
the application layer via the social domain). There is no fanout, no ranking, no
materialised timeline yet — those graduate later behind the same `PostRepository`
port when a DB adapter lands.

## NOT implemented (intentionally out of scope here)

- channel comments / channel reactions runtime, topics taxonomy
- global / discovery feed, ranking, recommendation
- synchronous write fanout to followers
- media payloads (only `mediaRefs` references pass through DTOs)

## Owns

- posts, feeds, comments, reactions, topics, read-models

## Does NOT own

- memberships, roles, profiles, friendships

## Submodules

- `posts/` — post creation, editing, lifecycle and storage
- `feeds/` — feed composition, ordering and read models
- `comments/` — comment threads and replies
- `reactions/` — reaction types and counts
- `topics/` — topic taxonomy and tagging
- `read-models/` — pre-computed read views for content
- `publisher/` — application orchestration for content publishing flow (NOT a data domain)

## Boundary notes

- content-v2 owns posts, feeds, comments, reactions, topics, read-models
- publisher is application orchestration, NOT a separate data domain
- content-v2 does NOT own social relations, profiles, community roles, or memberships
- Other domains must use content-v2/public-api, NOT submodule internals

## Public surface

- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)

- repository, service, policy, router, mapper, db, schema, cache-keys, internal
- All submodule internals (posts/repository, feeds/service, etc.)

## Canonical governance

- [Rules Registry](../../docs/governance/RULES_REGISTRY.yml)
- [Governance Index](../../docs/governance/GOVERNANCE_INDEX.md)
- [Domain Status Registry](../../docs/governance/DOMAIN_STATUS_REGISTRY.yml)
- [Status Taxonomy](../../docs/governance/STATUS_TAXONOMY.md)

Local exceptions: none
