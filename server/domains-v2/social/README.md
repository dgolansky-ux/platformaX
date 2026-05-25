# social

Status: `SCAFFOLD_ONLY`
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

## Purpose
Owns the social graph — friends, contacts, and relationship state.

## Owns
- Friends
- Contact graph
- Relationship state
- Contact access

## Does NOT own
- Profile PII
- Posts
- Feed engine

## Public surface
- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)
- repository, service, policy, router, mapper, db, schema, cache-keys, internal
