# application-v2/use-cases

Status: `PARTIAL`

Canonical location for flows that touch **2+ domains** (ADR-010, rule PX-APP-001).

A use-case orchestrates across domains by calling each domain's `public-api.ts` /
`contracts.ts` only — never a foreign `repository.ts` or `service.ts`. Domains
stay single-owner; cross-domain coordination lives here, not inside a domain
service.

## Active use-cases

- `profile/` — composes the **identity** and **media** domains into the
  profile view (owner + public). Canonical implementation under this directory
  (`service.ts`, `dto.ts`, `errors.ts`, `public-api.ts`, `__tests__/`). The
  frontend feature adapter depends only on `@shared/contracts/profile`; a
  future HTTP controller will mount on top of `./profile/public-api`.

## Note

Onboarding, publishing and app-shell flows will be added here directly as they
gain real cross-domain runtime (today they are `SCAFFOLD_ONLY`).
