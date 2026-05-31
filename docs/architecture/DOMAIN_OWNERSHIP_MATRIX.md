# PlatformaX V2 — Domain Ownership Matrix

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

> **Status source of truth:** `docs/governance/DOMAIN_STATUS_REGISTRY.yml`
> + `server/domains-v2/domain-registry.ts`. The `Status` column below is a
> read-through and MUST equal those two — `scripts/check-domain-status-registry.mjs`
> fails the build on drift between this matrix, the YAML registry and the
> TypeScript registry.

## Owner domains

| Domain | Owns | Does NOT own | Reads from | Public surface | Status |
|---|---|---|---|---|---|
| identity | profile, auth subject, public/private profile DTO, professions | feed, friendships, communities, posts | — | public-api, contracts, events | PARTIAL |
| social | friends/contact graph, relationship state, contact access | profile PII, posts, feed engine | identity (public-api) | public-api, contracts, events | PARTIAL |
| communities-v2 | community profile, members, roles, settings, invites, join requests, feed settings | posts, comments, chat, events, modules | identity, social (public-api) | public-api, contracts, events | PARTIAL |
| content-v2 | posts, feeds, comments, reactions, topics, read-models | memberships, roles, profiles, friendships | identity, communities-v2 (public-api) | public-api, contracts, events | PARTIAL |
| channels | channel definitions, follows, settings | messages, chat history, community roles, community membership | communities-v2 (public-api) | public-api, contracts, events | PARTIAL |
| chat | messages, conversations, read state, typing indicators | channels, community roles, profiles | channels, identity (public-api) | public-api, contracts, events | SCAFFOLD_ONLY |
| events | event definitions, RSVPs, event lifecycle, visibility | community membership, profiles, posts | identity, communities-v2 (public-api) | public-api, contracts, events | SCAFFOLD_ONLY |
| modules | ModuleDefinition, registry, enablement | actual module business data | communities-v2 (public-api) | public-api, contracts, events | PARTIAL |
| media | media assets, upload contracts, validation, refs | base64/dataUrl payloads (FORBIDDEN) | identity (public-api) | public-api, contracts, events | PARTIAL |

## Composition domains

| Domain | Owns | Does NOT own | Reads from | Public surface | Status |
|---|---|---|---|---|---|
| public-hub | composition/read view of public profiles and communities | source-of-truth data | identity, communities-v2, content-v2 (public-api) | public-api, contracts, events | PARTIAL |

## Operational domains

| Domain | Owns | Does NOT own | Reads from | Public surface | Status |
|---|---|---|---|---|---|
| notifications | notification delivery, templates, preferences | content creation, profiles | identity, communities-v2 (events) | public-api, contracts, events | SCAFFOLD_ONLY |
| search | search indexing, query engine, relevance | source data | all domains (events/public-api) | public-api, contracts, events | SCAFFOLD_ONLY |
| moderation | moderation rules, reports, actions, queues | content creation | content-v2, communities-v2 (events) | public-api, contracts, events | PARTIAL |
| audit | audit log, trail, events | business logic | all domains (events) | public-api, contracts, events | SCAFFOLD_ONLY |
| system | health, config, feature flags, maintenance | domain data | internal metrics | public-api, contracts, events | SCAFFOLD_ONLY |

## Application layers

| Layer | Purpose | Owns data | Reads from | Status |
|---|---|---|---|---|
| publisher | Content publishing orchestration | NO | content-v2, identity (public-api) | SCAFFOLD_ONLY |
| app-shell | Application shell composition | NO | all domains (public-api) | SCAFFOLD_ONLY |
| onboarding | User onboarding flow | NO | identity, communities-v2 (public-api) | SCAFFOLD_ONLY |

## Cross-domain import rules

| Allowed cross-domain | Blocked cross-domain |
|---|---|
| public-api.ts | repository |
| contracts.ts | service |
| events.ts | policy |
| explicitly public DTO | router, mapper, db, schema |
| | cache-keys, internal |
