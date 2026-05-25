# identity

Status: `SCAFFOLD_ONLY`
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

## Purpose
Owns the canonical user profile, authentication subject, and public/private profile projections.

## Owns
- Profile (public + private)
- Auth subject
- Profile DTOs
- Professions

## Does NOT own
- Feed
- Friendships
- Communities
- Posts

## Public surface
- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)
- repository, service, policy, router, mapper, db, schema, cache-keys, internal
