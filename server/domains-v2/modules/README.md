# modules

Status: `BACKEND_PARTIAL`
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

## Runtime (BACKEND_PARTIAL)
In-memory runtime: `definitions.ts` (5 whitelisted module slots), `policy.ts`
(whitelist + owner-type), `store.ts` (in-memory enablement), `service.ts`,
`public-api.ts`. Modules define + enable slots only — NO business data (the
owner domain keeps the real data). Public DTO has no PII. Whitelisted keys:
topics, events, integrations, newsletter_chat, channel_entry.

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

## Canonical governance

- [Rules Registry](../../docs/governance/RULES_REGISTRY.yml)
- [Governance Index](../../docs/governance/GOVERNANCE_INDEX.md)
- [Domain Status Registry](../../docs/governance/DOMAIN_STATUS_REGISTRY.yml)
- [Status Taxonomy](../../docs/governance/STATUS_TAXONOMY.md)

Local exceptions: none
