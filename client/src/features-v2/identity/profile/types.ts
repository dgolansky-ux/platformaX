/**
 * features-v2/identity/profile — typed boundary for app-v2 onboarding/profile.
 *
 * app-v2 must never import the identity backend domain directly. It depends on
 * the typed adapter exposed here, which translates UI-shaped inputs into the
 * identity service's `IdentityResult` and back into UI-friendly outcomes.
 *
 * The backend types are imported via `@server/domains-v2/identity/public-api`
 * (the only entry point identity exposes cross-domain). Both ends share the
 * same domain name ("identity"), so this stays within domain boundaries.
 */
import type {
  CompleteOnboardingInput,
  IdentityResult,
  PrivateProfileDTO,
  PublicProfileDTO,
  UpdatePrivateProfileInput,
} from "@server/domains-v2/identity/public-api";

export type CompleteOnboardingResult = IdentityResult<PrivateProfileDTO>;
export type GetPublicProfileResult = IdentityResult<PublicProfileDTO>;
export type GetMyProfileResult = IdentityResult<PrivateProfileDTO>;
export type UpdateMyProfileResult = IdentityResult<PrivateProfileDTO>;

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
  getMyProfile(userId: string): Promise<GetMyProfileResult>;
  getPublicProfile(
    viewerId: string | null,
    profileUserId: string,
  ): Promise<GetPublicProfileResult>;
  updateMyProfile(
    userId: string,
    input: UpdatePrivateProfileInput,
  ): Promise<UpdateMyProfileResult>;
};

export type { CompleteOnboardingInput, UpdatePrivateProfileInput };
