# Application Layer V2

Status: `PARTIAL`
Rule: **PX-APP-001** (ADR-010 — application use-cases boundary)

Application layers orchestrate flows but do NOT own source-of-truth data,
tables, repositories, or domain entities.

## Canonical use-cases location

Per ADR-010 / PX-APP-001, every flow that touches **2+ owner domains** lives
under `server/application-v2/use-cases/<flow>/`. That folder is the canonical
import target.

```
server/application-v2/
  use-cases/             # canonical entry for cross-domain flows (PX-APP-001)
    profile/             # identity + media
    README.md
  profile/               # implementation of the profile use-case
                         #   (kept here for binary-compatible tests; re-exported by use-cases/profile)
  runtime/               # outbox + idempotency runtime infrastructure
  publisher/             # SCAFFOLD_ONLY
  app-shell/             # SCAFFOLD_ONLY
  onboarding/            # SCAFFOLD_ONLY (onboarding now flows through use-cases/profile)
```

## Modules

- `use-cases/profile`: `PARTIAL` — canonical entry for identity + media
  composition. Re-exports the implementation in `profile/`.
- `profile/`: `PARTIAL` — implementation of the profile use-case (server-side
  boundary used by the frontend feature adapter; HTTP transport not yet wired).
- `runtime/`: `PARTIAL` — outbox + idempotency repositories (skeleton + tests).
- `publisher`: `SCAFFOLD_ONLY` — content publishing orchestration.
- `app-shell`: `SCAFFOLD_ONLY` — application shell composition.
- `onboarding`: `SCAFFOLD_ONLY` — placeholder; onboarding now goes through
  `use-cases/profile/completeOnboarding`.

## Boundary rules

- Use-cases import only `public-api.ts` / `contracts.ts` / `events.ts` from
  owner domains (identity, media). Never `repository.ts`, `service.ts`,
  `policy.ts`, `mapper.ts`, `router.ts`, `db/*` or `internal/*`.
- Never re-export raw domain DTOs across the application boundary — only the
  composed view DTOs.
- Never log PII; only safe error messages are exposed.
- New cross-domain flows MUST be created under `use-cases/<flow>/` from day one.

## Enforcement

- `scripts/check-application-use-cases-boundary.mjs` (PX-APP-001).
- `scripts/check-client-server-boundary.mjs` (PX-APP-001 split-readiness).
- `scripts/check-application-service-size.mjs` (PX-CODE-001 boundary for
  application services — 280-line soft cap with documented exception).
