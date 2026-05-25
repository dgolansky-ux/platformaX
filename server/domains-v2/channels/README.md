# channels

Status: `SCAFFOLD_ONLY`
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

## Purpose
Owns channel definitions, channel memberships, and channel settings.

## Owns
- Channel definitions
- Channel memberships
- Channel settings

## Does NOT own
- Messages
- Chat history
- Community roles

## Public surface
- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)
- repository, service, policy, router, mapper, db, schema, cache-keys, internal
