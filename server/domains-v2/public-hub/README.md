# public-hub

Status: `SCAFFOLD_ONLY`
Owner: @dgolansky-ux
Type: COMPOSITION_DOMAIN

## Purpose
Composes read-only public views of profiles and communities from other domains.

## Owns
- Composition logic
- Read view of public profiles
- Read view of public communities

## Does NOT own
- Source-of-truth data

## Public surface
- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)
- repository, service, policy, router, mapper, db, schema, cache-keys, internal
