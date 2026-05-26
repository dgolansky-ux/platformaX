# notifications

Status: `SCAFFOLD_ONLY`
Owner: @dgolansky-ux
Type: OPERATIONAL_DOMAIN

## Purpose
Owns notification delivery â€” templates, preferences, and dispatch.

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

## Canonical governance

- [Rules Registry](../../../docs/governance/RULES_REGISTRY.yml)
- [Governance Index](../../../docs/governance/GOVERNANCE_INDEX.md)
- [Domain Status Registry](../../../docs/governance/DOMAIN_STATUS_REGISTRY.yml)
- [Status Taxonomy](../../../docs/governance/STATUS_TAXONOMY.md)

Local exceptions: none
