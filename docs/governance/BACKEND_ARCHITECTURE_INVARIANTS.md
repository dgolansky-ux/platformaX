# PlatformaX V2 — Backend Architecture Invariants

Status: `ACTIVE`  
Owner: Architecture / Governance  
Applies to: `server/domains-v2`, `server/application-v2`, migrations, public-api, contracts, events, outbox  
Rules Registry: `docs/governance/RULES_REGISTRY.yml` (PX-OWN-*, PX-VIS-*, PX-DTO-002, PX-CTX-*, PX-MEDIA-004, PX-LIST-004, PX-DB-004, PX-EVENT-001, PX-LC-*, PX-IDEMP-*, PX-AIS-002)

> **Precedence:** If this file conflicts with `docs/governance/`, governance registry wins. This file is the canonical **backend invariant checklist** for agents and PR review.

---

## 1. Owner / viewer / resource model

Every domain resource record must define:

| Field | Meaning |
|---|---|
| `id` | UUID of the record (not proof of ownership) |
| `ownerUserId` / `ownerId` | User or entity that owns the resource |
| `viewerUserId` / `viewerContext` | Who is reading (on public read paths) |
| `slug` / `publicId` | Public URL identifier when the resource is addressable anonymously |

**Forbidden:**

- Using `id` alone as proof of ownership
- Mixing owner and viewer in one field or check
- Exposing raw `userId` in public URLs where `slug`/`publicId` is required
- `update` / `delete` / `attach` without owner check in service, policy, or tests

**Evidence:** policy tests, service input types, step report owner matrix.

---

## 2. Viewer context

Every public read of profile or owned resource must resolve `viewerContext`:

- `owner`
- `friend`
- `stranger`
- `anonymous`
- `admin` (when introduced)

Without `viewerContext`, public read must be **BLOCKED** or explicitly **public-only** (documented policy).

**Evidence:** public read service signature, policy tests, manual gate on new endpoints.

---

## 3. Visibility matrix

Profile and content elements must declare who can **view** and **edit**:

| Viewer | view | edit |
|---|---|---|
| owner | yes (unless disabled) | yes (policy permitting) |
| friend | per field | no (unless explicit) |
| stranger | per field | no |
| anonymous | per field | no |
| admin | later | per policy |

Applies to: bio, location, status, relationship/civil status, social links, avatar/banner, profile posts, milestones, contacts, friend feed preview, professional layer.

**Evidence:** `policy.ts` + tests; no ad-hoc visibility in routers.

---

## 4. Public DTO zero PII

Public DTO must **never** contain:

- email, phone, dateOfBirth
- private contact fields
- auth metadata, provider data, session, token
- raw Supabase user object
- internal storage path, service role, secrets

Flow: `DB record → mapper → DTO → public-api`.

**Enforced by:** `scripts/check-public-dto-pii.mjs`, `scripts/check-dto-privacy-classification.mjs` (PX-DTO-002, PX-SEC-001).

---

## 5. Resource context refs

Content must carry explicit context:

- `contextType` (e.g. `profile_presentation`, `milestone`, `friend_post`, `community_post`, `channel_post`)
- `contextOwnerId`
- `contextRefId`
- `visibility`
- `ownerUserId`

**Evidence:** contracts/DTO fields + mapper tests; manual gate for new content types.

---

## 6. Media ownership validation

Before attach, validate media asset:

- `id`, `ownerUserId`/`ownerId`, `ownerType`, `purpose`, `status`
- Asset belongs to attaching owner
- `purpose` matches attach operation
- Asset is not foreign-owned
- Public DTO does not expose internal storage path

**Enforced by:** media domain policy + tests; manual gate on new attach paths (PX-MEDIA-004).

---

## 7. Limit / cursor / stable order

Every runtime list, feed, or search must have:

- required `limit`
- `maxLimit` cap
- `cursor` or explicit fixed cap
- stable order (tie-breaker: `id` or `createdAt`)
- index plan when backed by DB

**Forbidden:** unbounded select/list, full scan without justification, search without limit, feed without cursor/fixed cap.

**Enforced by:** `scripts/check-pagination.mjs`, `scripts/check-scalability-patterns.mjs`, `scripts/check-scalability-hot-paths.mjs` (PX-LIST-004, PX-LIST-001, PX-SCALE-003).

---

## 8. No raw DB records outside domain

Allowed flow:

```txt
DB record → mapper → DTO → public-api
```

**Forbidden:**

- Raw DB row in router/public-api response
- Cross-domain `repository` / `service` / `mapper` / `db` imports
- `select(*)` on hot paths without documented justification

**Enforced by:** `scripts/audit-domain-boundaries.mjs`, `scripts/check-architecture-import-graph.mjs` (PX-DB-004, PX-ARCH-003).

---

## 9. Event / outbox for fanout

Fanout, notifications, feed projections, search indexing, read models:

```txt
write source of truth + outbox event (same transaction) → worker / read model
```

**Forbidden:** synchronous fanout to many users in the request path.

**Enforced by:** `scripts/check-scalability-hot-paths.mjs` (PX-EVENT-001, PX-SCALE-001).

### 9.1 Single read-model owner (PX-READMODEL-001)

Every read model projection has exactly one owner domain. Other domains may
emit events that feed the projection, but only the owner domain writes the
read model and is the source of truth for its shape.

- Feed / content projections are owned by `content-v2`.
- `social` emits events (follow, reaction) but does NOT co-own the feed
  read model — describing both as authoritative write-side owners of the
  same projection is forbidden.
- Search indexing is fed by events; the search domain owns its projection.

**Enforced by:** `scripts/check-read-model-single-owner.mjs` (structural)
and ADR-011 (architecture).

---

## 10. Status lifecycle

Entities with lifecycle must use explicit status enum, e.g.:

`draft`, `active`, `disabled`, `deleted`, `pending`, `approved`, `rejected`, `archived`

Do not hide or delete states ad hoc without domain policy.

**Evidence:** `contracts.ts` / DTO status field + tests (PX-LC-001; manual gate).

---

## 11. Idempotency

Create / publish / upload / finalize / retry-sensitive writes require:

- `idempotencyKey` persisted and honored, **or**
- explicit documented reason why idempotency is not required

**Evidence:** service contract + migration when table exists (PX-IDEMP-001; manual gate until table guard lands).

---

## 12. Architecture Impact Statement (AIS)

Every larger backend PR or agent task must answer:

1. Which domains are touched?
2. Which entities and owners?
3. Does public-api change?
4. New cross-domain dependency?
5. Using only public-api / contracts / events / outbox?
6. Can public DTO expose PII? (must be NO)
7. Do lists/feeds/search have limit/cursor/stable order?
8. Is media ownership validated on attach?
9. Is event/outbox needed?
10. Does domain status change?
11. Which tests/guards prove compliance?

Template: `docs/templates/ARCHITECTURE_IMPACT_STATEMENT.md`

Rule: **PX-AIS-002**

---

## Related docs

- `docs/architecture/PlatformaX-V2-active-rules.md` — constitution + runtime governance addendum
- `docs/architecture/PlatformaX-V2-architecture-enforcement.md` — enforcement matrix
- `docs/architecture/PlatformaX-V2-coding-standards.md` — backend section + invariants
- `docs/profile/PROFILE_RUNTIME_LOGIC_BLUEPRINT_FROM_LEGACY.md` — profile runtime
- `docs/governance/AGENT_COMMAND_STANDARD.md` — mandatory copy-paste block
