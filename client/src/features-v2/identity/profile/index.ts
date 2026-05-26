/**
 * features-v2/identity/profile — public entrypoint
 *
 * app-v2 consumes only this barrel. The backend identity + media domains are
 * reached via `profile-adapter.ts`, which is the only place allowed to import
 * from `@server/application-v2/profile/public-api` (and from the underlying
 * domain public APIs for the default composition).
 */
export { profileAdapter, createProfileAdapter } from "./profile-adapter";
export type {
  OnboardingProfileAdapter,
  CompleteOnboardingResult,
  GetMyProfileViewResult,
  GetPublicProfileViewResult,
  UpdateMyProfileResult,
  AttachProfileMediaRefResult,
  CompleteOnboardingInput,
  UpdatePrivateProfileInput,
  OwnerProfileView,
  PublicProfileView,
} from "./types";
