# content-v2

Status: `SCAFFOLD_ONLY`
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

## Purpose

Content domain for PlatformaX V2. Owns all content-related data and read models.

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
