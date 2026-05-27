# ADR-010 — Application Use-Cases Boundary

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

Status: `Accepted`  
Date: 2026-05-27  
Owner: Architecture  
Rule: **PX-APP-001**

## Context

Orchestration across two or more domains inside a single domain `service.ts` or `router.ts` creates hidden coupling and violates modular monolith boundaries.

## Decision

Flows touching **2+ domains** must be implemented under:

```txt
server/application-v2/use-cases/<flow-name>.ts
```

Use-cases may call domain `public-api.ts` / `contracts.ts` only — never foreign `repository.ts` or `service.ts`.

## Consequences

- Clear orchestration layer for profile wiring, publish flows, cross-domain commands.
- Domains stay single-responsibility.

## Alternatives considered

- “Coordinator” service inside largest domain — rejected (ownership blur).

## Migration / rollout

1. Skeleton `server/application-v2/use-cases/` with README.
2. Move existing multi-domain flows incrementally; status `PARTIAL` until moved.

## Guard / enforcement

- **manual_gate** + import graph review
- TODO: `scripts/check-application-use-cases-boundary.mjs`
