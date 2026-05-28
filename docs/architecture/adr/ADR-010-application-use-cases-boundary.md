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

1. Skeleton `server/application-v2/use-cases/` with README — DONE (2026-05-28).
2. Profile use-case has a canonical entry at
   `server/application-v2/use-cases/profile/public-api.ts`; the implementation
   continues to live at `server/application-v2/profile/` so existing tests and
   the `ProfileApplicationPort` wire contract remain binary-compatible. New
   multi-domain flows must create a `use-cases/<flow>/` folder from day one.
3. Status: `PARTIAL` — physical move of `profile/` into `use-cases/profile/`
   may follow once the HTTP transport lands, to keep refactor churn out of
   governance-only commits.

## Guard / enforcement

- `scripts/check-application-use-cases-boundary.mjs` — blocks files outside
  `server/application-v2/` that import the public-api of 2+ domains.
- `scripts/check-client-server-boundary.mjs` — blocks `client/src` imports of
  `@server/*` (split-readiness).
- `scripts/check-application-service-size.mjs` — caps application service
  files at 280 lines (PX-CODE-001 boundary) so use-cases stay decomposed
  rather than turning into god-services.
- Deeper "which use-cases exist, which are pure" review remains
  **manual_gate**.
