# application-v2/use-cases

Status: `PARTIAL`

Canonical location for flows that touch **2+ domains** (ADR-010, rule PX-APP-001).

A use-case orchestrates across domains by calling each domain's `public-api.ts` /
`contracts.ts` only — never a foreign `repository.ts` or `service.ts`. Domains
stay single-owner; cross-domain coordination lives here, not inside a domain
service.

## Active use-cases

- `profile.ts` — composes the **identity** and **media** domains into the
  profile view (owner + public). Canonical entry point for the frontend feature
  adapter wiring (`@shared/wiring/profile-wiring`) and a future HTTP controller.
  The implementation currently lives in `../profile/` (service/dto/errors) and is
  re-exported here per ADR-010's incremental migration path; `../profile/` will
  fold into this file as the move completes.

## Note

Onboarding, publishing and app-shell flows will be added here directly as they
gain real cross-domain runtime (today they are `SCAFFOLD_ONLY`).
