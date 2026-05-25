# communities-v2

Status: `SCAFFOLD_ONLY`
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

## Purpose
Owns community lifecycle — profile, members, roles, settings, invites, join requests, and feed settings.

## Owns
- Community profile
- Members
- Roles
- Settings
- Invites
- Join requests
- Feed settings

## Does NOT own
- Posts
- Comments
- Chat
- Events
- Modules

## Public surface
- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)
- repository, service, policy, router, mapper, db, schema, cache-keys, internal
