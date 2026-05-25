# modules

Status: `SCAFFOLD_ONLY`
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

## Purpose
Owns the module registry — definitions, enablement state, and module metadata.

## Owns
- ModuleDefinition
- Registry
- Enablement

## Does NOT own
- Actual module business data

## Public surface
- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)
- repository, service, policy, router, mapper, db, schema, cache-keys, internal
