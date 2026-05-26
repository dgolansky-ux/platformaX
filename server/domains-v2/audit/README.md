# audit

Status: `SCAFFOLD_ONLY`
Owner: @dgolansky-ux
Type: OPERATIONAL_DOMAIN

## Purpose
Owns the audit log — trail, events, and retention.

## Owns
- Audit log
- Trail
- Events

## Does NOT own
- Business logic

## Public surface
- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)
- repository, service, policy, router, mapper, db, schema, cache-keys, internal

## Canonical governance

- [Rules Registry](../../docs/governance/RULES_REGISTRY.yml)
- [Governance Index](../../docs/governance/GOVERNANCE_INDEX.md)
- [Domain Status Registry](../../docs/governance/DOMAIN_STATUS_REGISTRY.yml)
- [Status Taxonomy](../../docs/governance/STATUS_TAXONOMY.md)

Local exceptions: none
