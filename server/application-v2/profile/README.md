# application-v2/profile

Status: `PARTIAL`
Owner: @dgolansky-ux
Type: APPLICATION_LAYER

## Purpose

Thin composition layer that orchestrates the `identity` and `media` public
APIs into a single profile view DTO. Owns NO entities, NO persistence and NO
domain rules — it only translates raw domain errors into a small frontend-safe
code-set and composes media URL refs into the profile view.

## Constraints

- Imports only `public-api.ts` from `identity` and `media` — no internals.
- Returns ONLY the application view DTOs (`OwnerProfileView`,
  `PublicProfileView`); raw `PrivateProfileDTO` / `PublicProfileDTO` are not
  re-exported.
- All errors are mapped to `ProfileApplicationError` (small, stable codes).
- Public view never includes `email`, `phone`, `dateOfBirth` or auth metadata.
- No logging of PII.

## Use-cases

- `getMyProfileView(currentUserId)` — owner-only composed view.
- `getPublicProfileView(viewerId, profileUserId)` — visibility-gated public view.
- `completeOnboarding(currentUserId, input)` — owner-only onboarding completion.
- `updateMyProfile(currentUserId, patch)` — owner-only partial update.
- `attachProfileAvatarRef(currentUserId, assetId)` — verifies asset
  ownership/purpose/ready via media, then persists the avatar ref via identity.
- `attachProfileBannerRef(currentUserId, assetId)` — same for banner.

## Not done in this slice

- No HTTP transport / controller. The current runtime invokes the application
  service in-process via the frontend feature adapter
  (`PROFILE_RUNTIME_SERVER_READY_NOT_FULLY_HTTP_WIRED`).
- No live storage backend (media domain status remains PARTIAL).
- No persistent identity repository (`BLOCKER_REQUIRES_PERSISTENCE_ADAPTER`).
- Onboarding does not auto-attach an avatar ref (the explicit
  `attachProfileAvatarRef` use-case exists for that).

## Canonical governance

- [Rules Registry](../../../docs/governance/RULES_REGISTRY.yml)
- [Governance Index](../../../docs/governance/GOVERNANCE_INDEX.md)
- [Domain Status Registry](../../../docs/governance/DOMAIN_STATUS_REGISTRY.yml)
- [Status Taxonomy](../../../docs/governance/STATUS_TAXONOMY.md)

Local exceptions: none
