/**
 * features-v2/identity/profile — typed boundary for app-v2 onboarding/profile.
 *
 * app-v2 must never import the identity backend domain directly. It depends on
 * the typed adapter exposed here, which delegates to the
 * `ProfileApplicationService` (server/application-v2/profile). The adapter
 * always returns composed view DTOs (`OwnerProfileView` / `PublicProfileView`);
 * raw `PrivateProfileDTO` / `PublicProfileDTO` from the identity domain are
 * intentionally NOT re-exposed here.
 *
 * Types come from `@shared/contracts/` — never directly from `@server/*`.
 */
export type {
  OnboardingProfileAdapter,
  ProfileAdapterDeps,
  CompleteOnboardingResult,
  GetMyProfileViewResult,
  GetPublicProfileViewResult,
  UpdateMyProfileResult,
  AttachProfileMediaRefResult,
} from "@shared/wiring/profile-wiring";

export type {
  CompleteOnboardingInput,
  UpdatePrivateProfileInput,
  UpdatePersonalStatusInput,
} from "@shared/contracts/identity";

export type {
  OwnerProfileView,
  PublicProfileView,
  ProfileApplicationResult,
} from "@shared/contracts/profile";
