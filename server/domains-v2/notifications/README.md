# notifications

Status: `SCAFFOLD_ONLY`
Owner: @dgolansky-ux
Type: OPERATIONAL_DOMAIN

## Purpose
Owns notification delivery — templates, preferences, and dispatch.

## Owns
- Notification delivery
- Templates
- Preferences

## Does NOT own
- Content creation
- Profiles

## Public surface
- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)
- repository, service, policy, router, mapper, db, schema, cache-keys, internal
