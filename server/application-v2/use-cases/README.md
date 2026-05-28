# server/application-v2/use-cases

Status: `PARTIAL`
Owner: Architecture
Rule: **PX-APP-001** (ADR-010 — application use-cases boundary)

## Purpose

This folder is the **canonical home** for flows that orchestrate **2+ owner
domains**. Per ADR-010 / PX-APP-001, those flows MUST NOT live inside a single
domain's `service.ts` or `router.ts`. They live here as use-case modules.

A use-case module:

- imports only `public-api.ts` / `contracts.ts` / `events.ts` from owner
  domains — never `repository.ts`, `service.ts`, `policy.ts`, `mapper.ts`,
  `router.ts`, `db/*` or `internal/*`;
- depends on `@shared/contracts/*` for cross-cutting types
  (Result, ids, request context, etc.);
- returns a typed `Result<T, DomainError>` (or domain-equivalent) so callers
  do not need to catch.

## Layout

```
server/application-v2/use-cases/
  README.md
  profile/
    public-api.ts        # canonical entry point (re-exports the impl)
    README.md
```

## Current use-cases

| Use-case | Owner domains touched | Canonical entry | Status |
|---|---|---|---|
| profile | identity + media | `use-cases/profile/public-api.ts` | PARTIAL |

The profile use-case implementation currently lives at
`server/application-v2/profile/` so existing tests and the
`ProfileApplicationPort` wire contract continue to work unchanged. The
use-cases barrel here re-exports it as the canonical entry. New multi-domain
flows MUST create a `use-cases/<flow>/` folder.

## What does NOT belong here

- single-domain CRUD that calls only one domain's public-api — keep that in
  the owner domain;
- thin transport adapters (HTTP, tRPC) — those live next to the transport;
- pure utilities or value objects — those live in `@shared/contracts/*`.

## Enforcement

- `scripts/check-application-use-cases-boundary.mjs` fails when a file outside
  `server/application-v2/` imports the public-api of 2+ domains
  (PX-APP-001).
- `scripts/check-client-server-boundary.mjs` fails when `client/src/` imports
  any `@server/*` runtime (PX-APP-001 split-readiness).
- Deeper review (which use-cases exist, which are pure) stays `manual_gate`.
