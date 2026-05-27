# ADR-014 — Policy as Pure Functions

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

Status: `Accepted`  
Date: 2026-05-27  
Owner: Architecture  
Rules: **PX-POLICY-001**, **PX-VIS-001**, **PX-OWN-002**

## Context

Authorization scattered in routers or coupled to DB calls is hard to test and duplicates visibility mistakes.

## Decision

`policy.ts` exposes **pure** functions:

- `canView(context)`
- `canEdit(context)`
- `canAttach(context)`
- `canDelete(context)`

Inputs: viewerContext, resource, visibility matrix fields — **no IO**.

Routers/services fetch data, then call policy.

## Consequences

- Fast unit tests without DB.
- Aligns with profile visibility matrix in `BACKEND_ARCHITECTURE_INVARIANTS.md`.

## Alternatives considered

- Policy methods that query repository — rejected.

## Migration / rollout

Refactor ad-hoc checks when touching a domain; add tests per viewerContext.

## Guard / enforcement

- **manual_gate** — policy test review
- TODO: `scripts/check-policy-pure-functions.mjs`
