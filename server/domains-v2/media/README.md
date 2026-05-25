# media

Status: `SCAFFOLD_ONLY`
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

## Purpose
Owns media assets — upload contracts, validation, and media references.

## Owns
- Media assets
- Upload contracts
- Validation
- Refs

## Does NOT own
- base64/dataUrl payloads

## Public surface
- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)
- repository, service, policy, router, mapper, db, schema, cache-keys, internal
