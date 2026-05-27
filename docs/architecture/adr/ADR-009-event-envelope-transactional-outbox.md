# ADR-009 — EventEnvelope and Transactional Outbox

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

Status: `Accepted`  
Date: 2026-05-27  
Owner: Architecture  
Rules: **PX-EVENT-001**, **PX-EVENT-002**, **PX-SCALE-001**

## Context

Cross-domain side effects (notifications, feed projections, search indexing) must not run as synchronous multi-user fanout in the HTTP request path. Events must be typed, versioned, and idempotent.

## Decision

1. All cross-domain events use **EventEnvelope**:

   ```ts
   { id, type, version, occurredAt, actorId, payload, idempotencyKey }
   ```

2. **Transactional outbox**: persist the source-of-truth write and the outbox event row in the **same database transaction**.

3. Workers/read models consume outbox rows asynchronously.

## Consequences

- Request latency stays bounded.
- Retries are safe when `idempotencyKey` is honored.
- Requires outbox table and worker plumbing over time.

## Alternatives considered

- Direct async `Promise.all` fanout in service — rejected (PX-SCALE-001).
- Fire-and-forget HTTP to other domains — rejected (no transaction boundary).

## Migration / rollout

1. Add `events.ts` envelope types per domain.
2. Add outbox migration when DB work is approved (no live db push without decision).
3. Wire worker stub; mark domains `PARTIAL` until consumer exists.

## Guard / enforcement

- `scripts/check-scalability-hot-paths.mjs` — sync fanout patterns
- **manual_gate** — envelope shape and same-TX outbox until automated guards land
- `docs/governance/BACKEND_ARCHITECTURE_INVARIANTS.md` §9
