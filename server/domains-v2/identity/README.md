# identity

Status: `PARTIAL`
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

> runtime justification: service/repository runtime is required for the first
> end-to-end profile persistence slice (STEP_27). Persistence is currently
> backed by an in-memory adapter; a Supabase-backed adapter and the SQL
> migration are tracked under BLOCKER_REQUIRES_PERSISTENCE_ADAPTER.

## Purpose
Owns the canonical user profile, authentication subject, and public/private
profile projections. Owns the runtime that turns an onboarding submission into
a persisted profile.

## Owns
- Auth subject mapping
- Private profile (owner-only fields incl. PII)
- Public profile summary (PII-stripped projection)
- Onboarding status / completion event
- Profile visibility policy

## Does NOT own
- Friend feed / posts / comments / reactions (`content-v2`)
- Friendship graph / contact tiers (`social`)
- Media payloads (`media` — identity stores only `MediaAssetRef`)
- Community membership (`communities-v2`)
- Professional layer runtime (still UI-shell)

## Public surface
- `public-api.ts` — `createIdentityService`, `createInMemoryIdentityProfileRepository`, public DTOs, contracts, events, policy predicates, validation limits.
- `contracts.ts` — `UserId`, `CompleteOnboardingInput`, `UpdatePrivateProfileInput`, `IdentityResult`, `IdentityError`.
- `events.ts` — `OnboardingCompletedEvent`, `ProfilePublicSummaryChangedEvent`.

## Internal modules (not importable cross-domain)
- `service.ts`, `repository.ts`, `policy.ts`, `mapper.ts`
- `internal/private-profile-dto.ts` — owner-only DTO (PII)
- `internal/record.ts` — persistence record shape
- `internal/validation.ts` — input normalisation/validation

## Use-cases (this slice)
- `completeOnboarding(userId, input)` — owner-only; persists the onboarding payload, flips `onboardingCompleted`, emits events.
- `getMyProfile(userId)` — owner-only; returns `PrivateProfileDTO`.
- `updatePrivateProfile(userId, input)` — owner-only; partial update.
- `getPublicProfile(viewerId, profileUserId)` — visibility-gated; returns PII-free `PublicProfileDTO`.

## PII policy
- `PrivateProfileDTO` contains private fields (`phone`, `dateOfBirth`) and is owner-only.
- `PublicProfileDTO` MUST NOT contain `email`, `phone`, `dateOfBirth` or any auth metadata.
- Events carry only `userId` and timestamps — never PII.

## Not done yet
- No Supabase repository adapter — `BLOCKER_REQUIRES_PERSISTENCE_ADAPTER`. SQL migration shipped in `supabase/migrations/0001_identity_private_profiles.sql` but not applied.
- No HTTP/transport router yet — backend transport is out of scope for STEP_27.
- No professional layer runtime (`PROFESSIONAL_PROFILE_RUNTIME_NOT_STARTED`).
- No media upload runtime (`MEDIA_UPLOAD_NOT_STARTED`) — only `MediaAssetRef` is accepted.
- Admin role is a policy placeholder; no runtime path.
