# moderation

Status: `SCAFFOLD_ONLY`
Owner: @dgolansky-ux
Type: OPERATIONAL_DOMAIN

## Purpose
Owns moderation rules, reports, actions, and queues.

## Owns
- Moderation rules
- Reports
- Actions
- Queues

## Does NOT own
- Content creation

## Public surface
- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)
- repository, service, policy, router, mapper, db, schema, cache-keys, internal
