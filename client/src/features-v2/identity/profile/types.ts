/**
 * features-v2/identity/profile — typed boundary for app-v2 onboarding/profile.
 *
 * app-v2 depends on the typed adapter exposed here. All view/request/error types
 * come from the neutral wire contract `@shared/contracts/profile-view` — the
 * client never imports `@server/*` (split-ready, PX-APP-001). The adapter always
 * returns composed view DTOs (`OwnerProfileView` / `PublicProfileView`).
 */
import type {
  CompleteOnboardingInput,
  OwnerProfileView,
  ProfileApplicationPort,
  ProfileApplicationResult,
  PublicProfileView,
  UpdatePersonalStatusInput,
  UpdatePrivateProfileInput,
} from "@shared/contracts/profile-view";

export type CompleteOnboardingResult = ProfileApplicationResult<OwnerProfileView>;
export type GetMyProfileViewResult = ProfileApplicationResult<OwnerProfileView>;
export type GetPublicProfileViewResult = ProfileApplicationResult<PublicProfileView>;
export type UpdateMyProfileResult = ProfileApplicationResult<OwnerProfileView>;
export type AttachProfileMediaRefResult = ProfileApplicationResult<OwnerProfileView>;

/**
 * Frontend profile adapter = the application port plus an honesty flag about
 * whether writes persist across reloads.
 */
export type OnboardingProfileAdapter = ProfileApplicationPort & {
  /** Whether the adapter persists across reloads. UI-only/transport-less = false. */
  isPersistent(): boolean;
};

export type {
  CompleteOnboardingInput,
  UpdatePrivateProfileInput,
  UpdatePersonalStatusInput,
  OwnerProfileView,
  PublicProfileView,
};
