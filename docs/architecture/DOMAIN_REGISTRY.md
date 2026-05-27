# PlatformaX V2 — Domain Registry

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

Source of truth for all V2 domains, their types, ownership, and status.

## Domain types

- **OWNER_DOMAIN** — owns source-of-truth data, tables, entities
- **COMPOSITION_DOMAIN** — composes read views from other domains
- **OPERATIONAL_DOMAIN** — operational concern, no product ownership beyond declared scope
- **APPLICATION_LAYER** — orchestrates flows, does NOT own data

## Registry

| Domain | Type | Owns | Does NOT own | Public surface | Status | Required files |
|---|---|---|---|---|---|---|
| identity | OWNER_DOMAIN | profile, auth subject, public/private profile DTO, professions | feed, friendships, communities, posts | public-api, contracts, events | PARTIAL | README, public-api, contracts, events, dto, policy, index, test |
| social | OWNER_DOMAIN | friends/contact graph, relationship state, contact access | profile PII, posts, feed engine | public-api, contracts, events | SCAFFOLD_ONLY | README, public-api, contracts, events, dto, policy, index, test |
| communities-v2 | OWNER_DOMAIN | community profile, members, roles, settings, invites, join requests, feed settings | posts, comments, chat, events, modules | public-api, contracts, events | SCAFFOLD_ONLY | README, public-api, contracts, events, dto, policy, index, test |
| content-v2 | OWNER_DOMAIN | posts, feeds, comments, reactions, topics, read-models | memberships, roles, profiles, friendships | public-api, contracts, events | SCAFFOLD_ONLY | README, public-api, contracts, events, dto, policy, index, test |
| channels | OWNER_DOMAIN | channel definitions, memberships, settings | messages, chat history, community roles | public-api, contracts, events | SCAFFOLD_ONLY | README, public-api, contracts, events, dto, policy, index, test |
| chat | OWNER_DOMAIN | messages, conversations, read state, typing indicators | channels, community roles, profiles | public-api, contracts, events | SCAFFOLD_ONLY | README, public-api, contracts, events, dto, policy, index, test |
| events | OWNER_DOMAIN | event definitions, RSVPs, event lifecycle, visibility | community membership, profiles, posts | public-api, contracts, events | SCAFFOLD_ONLY | README, public-api, contracts, events, dto, policy, index, test |
| modules | OWNER_DOMAIN | ModuleDefinition, registry, enablement | actual module business data | public-api, contracts, events | SCAFFOLD_ONLY | README, public-api, contracts, events, dto, policy, index, test |
| media | OWNER_DOMAIN | media assets, upload contracts, validation, refs | base64/dataUrl payloads | public-api, contracts, events | PARTIAL | README, public-api, contracts, events, dto, policy, index, test |
| public-hub | COMPOSITION_DOMAIN | composition/read view of public profiles and communities | source-of-truth data | public-api, contracts, events | SCAFFOLD_ONLY | README, public-api, contracts, events, dto, policy, index, test |
| notifications | OPERATIONAL_DOMAIN | notification delivery, templates, preferences | content creation, profiles | public-api, contracts, events | SCAFFOLD_ONLY | README, public-api, contracts, events, dto, policy, index, test |
| search | OPERATIONAL_DOMAIN | search indexing, query engine, relevance | source data | public-api, contracts, events | SCAFFOLD_ONLY | README, public-api, contracts, events, dto, policy, index, test |
| moderation | OPERATIONAL_DOMAIN | moderation rules, reports, actions, queues | content creation | public-api, contracts, events | SCAFFOLD_ONLY | README, public-api, contracts, events, dto, policy, index, test |
| audit | OPERATIONAL_DOMAIN | audit log, trail, events | business logic | public-api, contracts, events | SCAFFOLD_ONLY | README, public-api, contracts, events, dto, policy, index, test |
| system | OPERATIONAL_DOMAIN | health, config, feature flags, maintenance | domain data | public-api, contracts, events | SCAFFOLD_ONLY | README, public-api, contracts, events, dto, policy, index, test |

## Application layers

| Layer | Type | Purpose | Owns data | Status |
|---|---|---|---|---|
| publisher | APPLICATION_LAYER | Content publishing orchestration | NO | SCAFFOLD_ONLY |
| app-shell | APPLICATION_LAYER | Application shell composition | NO | SCAFFOLD_ONLY |
| onboarding | APPLICATION_LAYER | User onboarding flow | NO | SCAFFOLD_ONLY |

## Allowed statuses

- `NOT_STARTED`
- `SCAFFOLD_ONLY`
- `UI_SHELL_ONLY`
- `MOCK_LOCAL_ONLY`
- `PARTIAL`
- `IMPLEMENTED`
- `BLOCKED`
- `MANUAL_REVIEW_REQUIRED`

## Blocked statuses

- `DONE`
- `FULL_DONE`
- `VISUAL_DONE`
- `BACKEND_DONE`
- `CLEAN`
- `PRODUCTION_READY`
