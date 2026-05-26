# Step 46 — Profile Runtime: Identity + Media + Onboarding Slice

Status: `PROFILE_RUNTIME_SERVER_READY_NOT_FULLY_HTTP_WIRED`
Date: 2026-05-26
Branch: `feat/profile-runtime-identity-media-onboarding`

## Scope

Backend / runtime vertical slice that introduces a thin server-side
application boundary on top of the existing `identity` and `media` domain
runtimes, and migrates the frontend to consume composed view DTOs through a
single feature adapter — without standing up a real HTTP transport, real
storage, or live database migrations.

## What was added

- New application layer: `server/application-v2/profile/`
  - `dto.ts` — composed view DTOs (`OwnerProfileView`, `PublicProfileView`,
    `ProfileMediaRefView`) with explicit privacy classification.
  - `errors.ts` — small, frontend-safe `ProfileApplicationError` code-set:
    `PROFILE_NOT_FOUND`, `PROFILE_FORBIDDEN`, `PROFILE_VALIDATION_FAILED`,
    `ONBOARDING_ALREADY_COMPLETED`, `MEDIA_ASSET_NOT_FOUND`,
    `MEDIA_ASSET_FORBIDDEN`, `MEDIA_ASSET_TYPE_MISMATCH`,
    `MEDIA_ASSET_NOT_READY`, `UNAUTHENTICATED`.
  - `service.ts` — `ProfileApplicationService` factory with six use-cases:
    `getMyProfileView`, `getPublicProfileView`, `completeOnboarding`,
    `updateMyProfile`, `attachProfileAvatarRef`, `attachProfileBannerRef`.
  - `public-api.ts` — stable boundary; only the service factory + view DTOs
    + error contract leak out.
  - 16 service tests covering composition, PII discipline and error mapping.
- New media use-case: `MediaService.verifyProfileAssetForAttach(userId,
  assetId, purpose)` performs the owner + purpose + ready check the
  application service needs before identity persists a profile media ref.
  Added `NOT_READY` to `MediaErrorCode`. Six new media tests cover the
  positive path, foreign-asset (`FORBIDDEN`), purpose mismatch
  (`INVALID_INPUT`), pending status (`NOT_READY`), unknown asset (`NOT_FOUND`)
  and empty `userId` (`FORBIDDEN`).
- Frontend feature adapter (`client/src/features-v2/identity/profile/`) now
  wraps the `ProfileApplicationService`. The adapter exposes only composed
  view DTOs; raw `PrivateProfileDTO` / `PublicProfileDTO` are no longer
  surfaced across the feature boundary. Renamed `getMyProfile` →
  `getMyProfileView`, `getPublicProfile` → `getPublicProfileView`; added
  `attachProfileAvatarRef` and `attachProfileBannerRef`.
- `client/src/app-v2/profile/data/` updated to consume the composed view in a
  single call (no more frontend-side composition of identity + media):
  - `fetchProfileData.ts` no longer takes a media adapter; it calls
    `profile.getMyProfileView(userId)` and the view comes with media URLs
    pre-resolved by the server.
  - `profile-view-model.ts` is now a pure projection (sync, no media
    resolution) from view DTOs into the shell's `PersonalProfileView`.
  - `useProfileData.ts` drops the `mediaAdapter` dependency.
- Onboarding remains wired to identity through the same adapter; the only
  change is that the error code for double-completion is now
  `ONBOARDING_ALREADY_COMPLETED` (mapped by the application layer).
- Profile bio edit hook (`useProfileBioEdit`) keeps the same shape; it only
  reads `result.error.message`, so the application error contract drops in
  cleanly.

## What was intentionally NOT done

- No HTTP transport / controller. The application service is invoked
  in-process by the frontend feature adapter; the same in-memory boundary the
  previous slice relied on still applies. `isPersistent() === false` is
  surfaced honestly.
- No live storage backend. Media remains `STORAGE_ADAPTER_ENV_REQUIRED`;
  the application's `attachProfileAvatarRef` / `attachProfileBannerRef`
  honestly fail with `MEDIA_ASSET_NOT_READY` while no storage is connected.
- No Supabase repository wired (identity persistence remains in-memory —
  `BLOCKER_REQUIRES_PERSISTENCE_ADAPTER`).
- No live DB push, no Railway, no production deploy, no migrations applied.
- No professional layer runtime, social graph, friend feed, content-v2 or
  community runtime. Out of scope.
- No `localStorage` / `sessionStorage` fallback, no `readAsDataURL`, no
  base64 / dataUrl uploads, no SERVICE_ROLE_KEY anywhere in the frontend.
- No dependency added.
- No guard weakened. `audit-domain-boundaries.mjs` continues to forbid
  `@server/*` imports in `app-v2/` — the only `@server/...` consumer added
  is the feature adapter in `features-v2/identity/profile`, where it is
  the explicit boundary entry point.

## Status truth

| Surface | Previous | New |
|---|---|---|
| `server/domains-v2/identity` | `PARTIAL` | `PARTIAL` (unchanged) |
| `server/domains-v2/media` | `PARTIAL` | `PARTIAL` — new `verifyProfileAssetForAttach` use-case |
| `server/application-v2/profile` | did not exist | `PARTIAL` (server-ready, no HTTP transport) |
| `client/src/features-v2/identity` | `PARTIAL` | `PARTIAL` — adapter now wraps application service |
| `client/src/app-v2/profile` | `PARTIAL` | `PARTIAL` — reads via composed view, no direct media call |

`server/application-v2/profile` documents its own status as `PARTIAL` in
`README.md` with the exact runtime evidence and explicit "not done" list. No
`IMPLEMENTED` claim anywhere. No fake DONE.

## Final status

`PROFILE_RUNTIME_SERVER_READY_NOT_FULLY_HTTP_WIRED`

The application service is real (composed identity + media, owner-validated
media attachment, PII-free public DTO, safe error contract) and is wired to
the frontend feature adapter in-process. HTTP transport / a real
controller-router is intentionally out of scope for this slice.

## Gate results

| Gate | Result |
|---|---|
| `pnpm check` (tsc --noEmit) | PASS |
| `pnpm lint` (eslint --max-warnings=0) | PASS |
| `pnpm test` (vitest run, 506 tests) | PASS |
| `pnpm build` (vite build) | PASS |
| `pnpm rules:check` (43 guards) | PASS |
| `pnpm arch:check:v2` (9 gates) | PASS |
| `pnpm guards:all-local` (25/25 BRAMKA + extras) | PASS |

## Forbidden actions — explicit confirmation

- No `--no-verify` used. (PX-GOV-003)
- No direct push to main. (PX-GOV-004)
- No force push. (PX-GOV-004)
- No guard softened or removed. (PX-GOV-002)
- No `localStorage`/`sessionStorage` fake backend introduced. (active-rules §2)
- No base64 / dataUrl / readAsDataURL upload runtime introduced. (PX-MEDIA-001)
- No PII added to any public DTO. (PX-SEC-001, PX-DTO-001)
- No legacy runtime imported. (PX-ARCH-001, PX-ARCH-002)
- No Supabase `db push` / live migration executed. (PX-INFRA-002, PX-DB-001)
- No Railway action taken. (PX-INFRA-001)
- No dependency added. (PX-DEPS-001)
- No SERVICE_ROLE_KEY introduced anywhere in the frontend graph. (PX-SEC-002)

## Self-audit

| Item | Result |
|---|---|
| Governance docs read before work (`PX-AI-001`) | YES — `docs/governance/*`, `docs/architecture/*`, `docs/profile/*`, identity/media README, public-api files |
| Status truth honored (`PX-AI-002`, `PX-STATUS-001`) | YES — final status is `SERVER_READY_NOT_FULLY_HTTP_WIRED`, not `DONE` |
| 12-field SELF-AUDIT included | YES — this section |
| `pnpm rules:check` PASS | YES |
| `pnpm arch:check:v2` PASS | YES |
| `pnpm check` PASS | YES |
| `pnpm lint` PASS | YES |
| `pnpm test` PASS | YES |
| `pnpm build` PASS | YES |
| No fake DONE (`PX-GOV-001`) | YES |
| No PII in any public DTO (`PX-SEC-001`) | YES — verified by `check-public-dto-pii`, new tests assert `phone`/`dateOfBirth` absent in public view |
| No guard weakened (`PX-GOV-002`) | YES |
| BLOCKED if rules conflict (`PX-AI-003`) | N/A — no rules conflict |

## Evidence

- New domain code: `server/application-v2/profile/{dto,errors,service,public-api,index}.ts`, `server/application-v2/profile/README.md`
- New tests: `server/application-v2/profile/__tests__/service.test.ts` (16 tests)
- Media additions: `server/domains-v2/media/{contracts,service}.ts` + 6 new tests in `__tests__/service.test.ts`
- Frontend adapter: `client/src/features-v2/identity/profile/{types,profile-adapter,index}.ts`
- Frontend data layer: `client/src/app-v2/profile/data/{fetchProfileData,profile-view-model,useProfileData}.ts`
- Tests rewritten: `client/src/features-v2/identity/profile/__tests__/profile-adapter.test.ts`, `client/src/app-v2/profile/data/__tests__/{fetchProfileData,profile-view-model}.test.ts`, `client/src/app-v2/onboarding/__tests__/OnboardingFlow.test.tsx`
