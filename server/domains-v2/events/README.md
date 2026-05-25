# events

Status: `SCAFFOLD_ONLY`
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

## Purpose
Owns event definitions, RSVPs, event lifecycle, and event visibility.

## Owns
- Event definitions
- RSVPs
- Event lifecycle
- Event visibility

## Does NOT own
- Community membership
- Profiles
- Posts

## Public surface
- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)
- repository, service, policy, router, mapper, db, schema, cache-keys, internal
