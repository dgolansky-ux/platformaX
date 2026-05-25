# search

Status: `SCAFFOLD_ONLY`
Owner: @dgolansky-ux
Type: OPERATIONAL_DOMAIN

## Purpose
Owns search indexing, query engine, and relevance scoring.

## Owns
- Search indexing
- Query engine
- Relevance

## Does NOT own
- Source data

## Public surface
- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)
- repository, service, policy, router, mapper, db, schema, cache-keys, internal
