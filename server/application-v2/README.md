# Application Layer V2

Status: `PARTIAL`

Application layers orchestrate flows but do NOT own source-of-truth data, tables, repositories, or domain entities.

## Modules
- use-cases/profile: `PARTIAL` — composes identity + media into the profile view
  (server-side boundary used by the frontend feature adapter; HTTP transport
  not yet wired). Canonical location for 2+ domain orchestration per ADR-010 /
  PX-APP-001.
- publisher: `SCAFFOLD_ONLY` — content publishing orchestration.
- app-shell: `SCAFFOLD_ONLY` — application shell composition.
- onboarding: `SCAFFOLD_ONLY` — placeholder; onboarding now goes through
  `application-v2/use-cases/profile/completeOnboarding`.

## Boundary rules
- Application services import only `public-api.ts` from owner domains (identity, media).
- Never re-export raw domain DTOs across the application boundary — only view DTOs.
- Never log PII; only safe error messages are exposed.
