# communities-v2

Status: `BACKEND_PARTIAL`
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

## Purpose
Owns community lifecycle — profile, members, roles, settings, invites, join requests, and feed settings.

## Runtime (BACKEND_PARTIAL)
In-memory runtime: `service.ts`, `store.ts` (in-memory repository adapters
behind `ports.ts`), `policy.ts`, `mapper.ts`. `public-api.ts` exports the
service factory + in-memory repos + the `CommunityAuthorityResolver` contract
(consumed cross-domain by channels/public-hub). No DB, no transport yet.
Public DTO carries no PII and no founder id. No posts stored here.

## Owns
- Community profile
- Members
- Roles
- Settings
- Invites
- Join requests
- Feed settings

## Does NOT own
- Posts
- Comments
- Chat
- Events
- Modules

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
