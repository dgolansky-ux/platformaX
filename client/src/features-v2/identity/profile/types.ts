/**
 * features-v2/identity/profile — typed boundary for app-v2 onboarding/profile.
 *
 * app-v2 never imports the identity backend domain directly. It depends on the
 * `OnboardingProfileAdapter` contract exposed in `@shared/contracts/profile`,
 * implemented today by the local mock adapter (MOCK_LOCAL_ONLY,
 * BACKEND_NOT_STARTED) and tomorrow by an HTTP transport. The adapter always
 * returns composed view DTOs (`OwnerProfileView` / `PublicProfileView`); raw
 * `PrivateProfileDTO` / `PublicProfileDTO` from the identity domain are
 * intentionally NOT re-exposed here.
 *
 * Types come from `@shared/contracts/*` — never directly from `@server/*`.
 */
export type {
  OnboardingProfileAdapter,
  CompleteOnboardingResult,
  GetMyProfileViewResult,
  GetPublicProfileViewResult,
  UpdateMyProfileResult,
  AttachProfileMediaRefResult,
  OwnerProfileView,
  PublicProfileView,
  ProfileApplicationResult,
  ProfileApplicationError,
  ProfileApplicationErrorCode,
} from "@shared/contracts/profile";

export type {
  CompleteOnboardingInput,
  UpdatePrivateProfileInput,
  UpdatePersonalStatusInput,
} from "@shared/contracts/identity";
