# ADR-013 — Opaque Cursor Standard

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

Status: `Accepted`  
Date: 2026-05-27  
Owner: Architecture  
Rules: **PX-CURSOR-001**, **PX-LIST-004**, **PX-LIST-001**

## Context

Offset pagination (`LIMIT x OFFSET y`) degrades on large feeds and invites unstable pages under concurrent writes.

## Decision

Runtime list/feed/search APIs use **opaque cursor** pagination:

- Response: `items`, `nextCursor`, `hasMore`
- Stable sort: primary field + tie-breaker (`id` or `createdAt`)
- `limit` required; `maxLimit` enforced server-side
- No offset on hot paths for large collections

## Consequences

- Repository contracts encode cursor encode/decode.
- Index design must match sort columns.

## Alternatives considered

- Page number API — allowed only for small admin tools, not public feeds.

## Migration / rollout

New endpoints use cursor from day one; existing endpoints migrate when touched.

## Guard / enforcement

- `scripts/check-pagination.mjs`, `scripts/check-scalability-patterns.mjs`
- **manual_gate** for offset on new runtime endpoints
