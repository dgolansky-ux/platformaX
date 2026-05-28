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

- `pnpm arch:check:v2` — umbrella for the architecture-only subset.
- `pnpm guards:all-local` — umbrella for all CI-required guards, including everything below.
- `node scripts/audit-domain-boundaries.mjs` — enforces the public-api boundary: domains MUST be imported via `public-api.ts`/`contracts.ts`/`events.ts`; deep imports into another domain's `repository`/`service`/`policy`/`router`/`mapper`/`internal/*` fail closed (replaces the historical `check-public-api-surface.mjs` placeholder, which was never implemented).
- `node scripts/check-architecture-import-graph.mjs` — enforces acyclic import graph between domains and matches `DOMAIN_OWNERSHIP_MATRIX.md`.
- `node scripts/check-no-legacy-imports.mjs`
- `node scripts/check-removed-product-areas.mjs`
- `node scripts/check-public-dto-pii.mjs`
- `node scripts/check-dto-privacy-classification.mjs`
- `node scripts/check-code-quality-structure.mjs`
- `node scripts/check-scalability-patterns.mjs`
- `node scripts/check-scalability-hot-paths.mjs`
- `node scripts/check-frontend-performance-patterns.mjs`
- `node scripts/check-status-truth-consistency.mjs`
- `node scripts/check-dependency-discipline.mjs`
- `node scripts/check-logging-pii-security.mjs`
- TODO: dedicated dependency boundary checker (`dependency-cruiser` or ESLint boundaries) — currently covered by `audit-domain-boundaries.mjs` + `check-architecture-import-graph.mjs`; tracked as `TODO_GUARD` in `RULES_TO_GUARDS_MATRIX.md`.

## 14. Backend and runtime invariant enforcement map

Canonical invariant doc: `docs/governance/BACKEND_ARCHITECTURE_INVARIANTS.md`  
Runtime addendum: `docs/architecture/PlatformaX-V2-active-rules.md` §10  
Matrix: `docs/governance/RULES_TO_GUARDS_MATRIX.md`

### Automatically guarded (fail closed in CI)

| Invariant | Rules | Guards |
|---|---|---|
| Public DTO zero PII | PX-SEC-001, PX-DTO-001, PX-DTO-002 | check-public-dto-pii, check-dto-privacy-classification |
| List limit/cursor/stable order | PX-LIST-001, PX-LIST-004, PX-SCALE-003, PX-CURSOR-001 | check-pagination, check-scalability-patterns, check-scalability-hot-paths |
| No raw DB / cross-domain internals | PX-ARCH-003, PX-DB-004 | audit-domain-boundaries, check-architecture-import-graph |
| No sync fanout | PX-SCALE-001, PX-EVENT-001 | check-scalability-hot-paths |
| No base64 media upload | PX-MEDIA-001 | check-media-base64 |
| Domain boundaries / ownership registry | PX-ARCH-005 | check-domain-registry |

### Manual gate (PR + AIS + tests required)

| Invariant | Rules | Why manual |
|---|---|---|
| Owner/viewer/resource model | PX-OWN-001, PX-OWN-002 | Needs semantic review of new endpoints |
| Visibility matrix | PX-VIS-001, PX-POLICY-001 | Policy completeness per field |
| Resource context refs | PX-CTX-001 | New content types vary |
| Media attach validation | PX-MEDIA-004 | Attach paths need domain tests |
| EventEnvelope + transactional outbox | PX-EVENT-001, PX-EVENT-002 | Outbox table not fully automated yet |
| Lifecycle status | PX-LC-001, PX-LIFECYCLE-001 | Schema-dependent |
| Idempotency persistence | PX-IDEMP-001, PX-IDEMPOTENCY-001 | Table guard TODO |
| Application use-cases | PX-APP-001 | Orchestration review |
| Read-model single owner | PX-READMODEL-001 | Ownership matrix review |
| Contract tests | PX-CONTRACT-001 | Per-domain test coverage |
| Branded IDs / Result | PX-ID-001, PX-ERROR-001 | Gradual adoption |
| Design tokens / presentational split | PX-UI-001, PX-UI-002 | Visual/import review |
| Correlation ID / seeds | PX-OBS-003, PX-SEED-001 | Infra wiring review |
| Architecture Impact Statement | PX-AIS-002, PX-ADR-001 | Report/PR body |

### PR must prove compliance

1. List touched domains and entities with owners.
2. Paste or link Architecture Impact Statement (template in `docs/templates/ARCHITECTURE_IMPACT_STATEMENT.md`).
3. Attach gate logs: `pnpm rules:check`, `pnpm arch:check:v2`.
4. For manual-gate rules: cite tests, policy files, or explicit `MANUAL_GATE_REQUIRED` note in step report.

### When a task must end BLOCKED

- Missing `viewerContext` on new public reads without public-only policy.
- Public DTO adds PII fields or guard failures.
- New list/feed/search without limit/cursor/stable order.
- Cross-domain repository/mapper import introduced.
- Sync fanout loop added in request path.
- Agent claims BACKEND_DONE / IMPLEMENTED without runtime evidence (**PX-STATUS-003**, **PX-RUNTIME-002**).
- Gates red and not in scope to fix.

## 15. Acceptance

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
