# system

Status: `SCAFFOLD_ONLY`
Owner: @dgolansky-ux
Type: OPERATIONAL_DOMAIN

## Purpose
Owns system-level concerns — health, config, feature flags, and maintenance mode.

## Owns
- Health
- Config
- Feature flags
- Maintenance

## Does NOT own
- Domain data

## Public surface
- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)
- repository, service, policy, router, mapper, db, schema, cache-keys, internal
