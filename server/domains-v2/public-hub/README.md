# public-hub

Status: `PARTIAL` (BACKEND_PARTIAL)
Owner: @dgolansky-ux
Type: COMPOSITION_DOMAIN

## Purpose
Composes read-only public views of profiles and communities from other domains.

## Implemented (BACKEND_PARTIAL)

A pure composition runtime that owns no data and performs no writes:

- `dto.ts` — `HubViewModel` (ownerType, ownerId, owner summary, enabled modules,
  visible section keys). Public DTO, no PII.
- `contracts.ts` — driven resolver ports `HubOwnerResolver` /
  `HubModulesResolver`. The **application layer** implements these on top of the
  owner domains' public-api (identity, communities-v2, modules). public-hub never
  imports those domains directly — it depends only on the resolver interfaces.
- `policy.ts` — `visibleSections(ownerType, enabledModuleKeys)` (about always;
  modules when any enabled; channels = community + channel_entry; feed_preview on
  profiles).
- `service.ts` — `createPublicHubService`: `getProfileHubView` /
  `getCommunityHubView` (NOT_FOUND when the owner summary is absent/not public).
- `mapper.ts` — `toHubViewModel`.

## NOT implemented (out of scope here)

- Persistence / caching of composed views (recomputed per call).
- Section-level content payloads (only section *keys* are returned).
- Any write path — composition is read-only by definition.

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

## Canonical governance

- [Rules Registry](../../docs/governance/RULES_REGISTRY.yml)
- [Governance Index](../../docs/governance/GOVERNANCE_INDEX.md)
- [Domain Status Registry](../../docs/governance/DOMAIN_STATUS_REGISTRY.yml)
- [Status Taxonomy](../../docs/governance/STATUS_TAXONOMY.md)

Local exceptions: none
