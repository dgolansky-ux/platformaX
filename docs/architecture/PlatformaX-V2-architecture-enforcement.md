# PlatformaX V2 — Architecture Enforcement

Status: `ACTIVE`  
Owner: Architecture / Governance  
Applies to: backend domains, frontend features, app routing, scripts, CI  
Governance Index: `docs/governance/GOVERNANCE_INDEX.md`

> **Note:** `docs/governance/` is the central governance index and registry.
> This file remains the authoritative source of architecture enforcement rules.

## 1. Purpose

This document converts the V2 architecture into enforceable rules.

The architecture is not a diagram. It is a set of boundaries that must be defended by code review, scripts, tests, Git hooks and CI.

## 2. Target model

PlatformaX V2 is a modular monolith.

The system is deployed as a coherent application at the beginning, but it is structured so that frontend, API, worker and realtime services can be separated later without rewriting domain logic.

Expected top-level structure:

```txt
client/src/app-v2
client/src/features-v2
client/src/features-v2/shared-ui

server/domains-v2/identity
server/domains-v2/social
server/domains-v2/communities-v2
server/domains-v2/content-v2
server/domains-v2/channels
server/domains-v2/chat
server/domains-v2/events
server/domains-v2/modules
server/domains-v2/public-hub
server/domains-v2/media
server/domains-v2/notifications
server/domains-v2/search
server/domains-v2/moderation
server/domains-v2/audit
server/domains-v2/system

shared
scripts
docs
```

## 3. Domain types

| Type | Domains | Role |
|---|---|---|
| Owner domains | identity, social, communities-v2, content-v2, channels, chat, events, modules, media | Own source of truth, policy and contracts. |
| Composition domains | public-hub, discovery, optional home/read surfaces | Compose views; never own source data. |
| Operational domains | notifications, search, moderation, audit, system | Outbox, projections, health, config, audit, safety. |
| Application layers | publisher, app shell, onboarding flows | Orchestrate flows; do not own main entities. |

## 4. Standard backend domain shape

```txt
server/domains-v2/<domain>/
  README.md
  public-api.ts
  contracts.ts
  dto.ts
  mapper.ts
  policy.ts
  service.ts
  repository.ts
  router.ts
  events.ts
  cache-keys.ts
  __tests__/
```

Required meaning:

| File | Purpose | Public across domains? |
|---|---|---|
| `public-api.ts` | stable synchronous integration surface | yes |
| `contracts.ts` | stable types/contracts | yes |
| `events.ts` | event/outbox contracts | yes |
| `dto.ts` | public/private/admin DTOs | selected exports only |
| `router.ts` | transport | no |
| `service.ts` | use-cases | no |
| `repository.ts` | persistence | no |
| `policy.ts` | authorization/visibility | no, except through public-api |
| `mapper.ts` | raw -> DTO mapping | no |
| `cache-keys.ts` | local cache keys | no |

## 5. Cross-domain rule

Allowed:

```ts
import { something } from "../other-domain/public-api";
import type { Contract } from "../other-domain/contracts";
import type { DomainEvent } from "../other-domain/events";
```

Forbidden:

```ts
import { repo } from "../other-domain/repository";
import { service } from "../other-domain/service";
import { policy } from "../other-domain/policy";
import { router } from "../other-domain/router";
import { mapThing } from "../other-domain/mapper";
import { table } from "../other-domain/db/schema";
import { cacheKey } from "../other-domain/cache-keys";
```

If a domain needs data or policy from another domain, it must request a public contract. If the contract does not exist, mark the task `BLOCKER_REQUIRES_CONTRACT`.

## 6. Frontend boundaries

| Layer | May import | Must not import |
|---|---|---|
| `client/src/app-v2` | route metadata, public feature entrypoints, shared UI | legacy runtime, removed pages, server internals |
| `features-v2/<domain>` | own components, own fixtures, own adapters, shared-ui | internals of another feature domain |
| `features-v2/shared-ui` | neutral UI primitives | domain fixtures, API calls, business logic |
| legacy/reference files | nothing in active V2 | never imported at runtime |

`app-v2` is a composition layer. It may assemble screens from multiple features. It must not become a god-feature or bypass domain boundaries.

## 7. Public API surface rules

A public API may expose:

- stable DTOs
- stable command/query contracts
- policy checks with small deterministic answers
- event publishing contracts
- small summary lookups
- integration helpers intentionally designed for other domains

A public API must not expose:

- repository instances
- raw DB records
- query builders
- internal services
- transport routers
- mapper internals
- broad “get everything” functions
- PII unless it is a private/admin contract protected by policy

## 8. DTO enforcement

Every public DTO must have:

- explicit type
- PII classification
- mapper test
- no raw DB leakage
- no private contact fields
- stable versioning plan if externally consumed

Forbidden in public DTO:

- email
- phone
- date of birth
- private contact fields
- auth provider metadata
- tokens
- service role data
- raw DB row

## 9. List/feed/search enforcement

Every runtime list/feed/search API must include:

- `limit`
- `maxLimit`
- cursor or explicit fixed cap
- stable order
- `hasMore` / `nextCursor` where applicable
- index plan if backed by DB
- tests for empty page, next page and max limit

Forbidden:

- fetch-all runtime endpoints
- large JS sort after loading unbounded rows
- N+1 per card/feed item
- search without rate-limit plan
- logging private search terms

## 10. Media enforcement

Allowed path:

```txt
client -> media domain request -> presigned upload -> storage provider -> media ref -> owner domain stores media ref
```

Forbidden path:

```txt
client -> base64/dataUrl/readAsDataURL -> JSON body -> random domain
```

The media domain owns:

- presigned upload
- provider abstraction
- validation
- media asset status
- public/CDN URL abstraction
- future thumbnails/transcoding

Other domains store references, not file payloads.

## 11. Events and outbox

Use synchronous public APIs only for small deterministic checks.

Use events/outbox for:

- notifications
- search indexing
- read-model updates
- async fanout
- expensive projections
- worker handoff

Event contracts must be typed, idempotent and version-aware.

## 12. Build and route containment

The active app graph must not include removed legacy routes, backend routers or chunks.

Guard must scan:

- `client/src/App.tsx`
- `client/src/app-v2/**`
- route registry files
- nav/sidebar/header/footer/home links
- server router registry
- build manifest and chunk names
- static imports reachable from active routes

## 13. Required architecture gates

At minimum:

- `pnpm arch:check:v2`
- `node scripts/audit-domain-boundaries.mjs`
- `node scripts/check-no-legacy-imports.mjs`
- `node scripts/check-removed-product-areas.mjs`
- `node scripts/check-public-api-surface.mjs`
- `node scripts/check-public-dto-pii.mjs`
- `node scripts/check-code-quality-structure.mjs`
- `node scripts/check-scalability-patterns.mjs`
- `node scripts/check-frontend-performance-patterns.mjs`
- `node scripts/check-status-truth-consistency.mjs`
- `node scripts/check-dependency-discipline.mjs`
- `node scripts/check-logging-pii-security.mjs`
- dependency boundary checker (`dependency-cruiser` or ESLint boundaries)

## 14. Acceptance

Architecture is acceptable only when:

- forbidden imports are zero,
- every active domain has README/status/public-api or explicit scaffold status,
- no legacy runtime is reachable,
- active routes and chunks are clean,
- public DTOs pass PII tests,
- rules are enforced in CI, not only in docs,
- no unbounded lists/feeds/searches exist without limit+cursor,
- no functions exceed 80 lines (components 140),
- no `transition: all` in CSS modules,
- no PII in logs or public DTOs,
- dependency discipline is maintained.
