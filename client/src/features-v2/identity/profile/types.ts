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
 * Identity backend types (`CompleteOnboardingInput`, `UpdatePrivateProfileInput`)
 * are re-used as request shapes since the application service forwards them.
 */
import type {
  CompleteOnboardingInput,
  UpdatePrivateProfileInput,
} from "@server/domains-v2/identity/public-api";
import type {
  OwnerProfileView,
  ProfileApplicationResult,
  PublicProfileView,
} from "@server/application-v2/profile/public-api";

export type CompleteOnboardingResult = ProfileApplicationResult<OwnerProfileView>;
export type GetMyProfileViewResult = ProfileApplicationResult<OwnerProfileView>;
export type GetPublicProfileViewResult = ProfileApplicationResult<PublicProfileView>;
export type UpdateMyProfileResult = ProfileApplicationResult<OwnerProfileView>;
export type AttachProfileMediaRefResult = ProfileApplicationResult<OwnerProfileView>;

export type OnboardingProfileAdapter = {
  /**
   * Whether the adapter persists across reloads. The current in-memory adapter
   * returns `false` (state is volatile until the Supabase repository is wired).
   */
  isPersistent(): boolean;
  completeOnboarding(
    userId: string,
    input: CompleteOnboardingInput,
  ): Promise<CompleteOnboardingResult>;
  getMyProfileView(userId: string): Promise<GetMyProfileViewResult>;
  getPublicProfileView(
    viewerId: string | null,
    profileUserId: string,
  ): Promise<GetPublicProfileViewResult>;
  updateMyProfile(
    userId: string,
    input: UpdatePrivateProfileInput,
  ): Promise<UpdateMyProfileResult>;
  attachProfileAvatarRef(
    userId: string,
    assetId: string,
  ): Promise<AttachProfileMediaRefResult>;
  attachProfileBannerRef(
    userId: string,
    assetId: string,
  ): Promise<AttachProfileMediaRefResult>;
};

export type {
  CompleteOnboardingInput,
  UpdatePrivateProfileInput,
  OwnerProfileView,
  PublicProfileView,
};
