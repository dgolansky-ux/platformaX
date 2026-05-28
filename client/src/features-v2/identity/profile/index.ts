/**
 * features-v2/identity/profile — public entrypoint
 *
 * app-v2 consumes only this barrel. The backend identity + media domains are
 * reached via `@shared/wiring/profile-wiring`, which is the only module
 * allowed to import `@server/*` factories. This barrel re-exports the clean
 * adapter surface; no `@server/*` imports anywhere in `client/**`.
 */
export { profileAdapter, createProfileAdapter } from "./profile-adapter";
export type {
  ProfileAdapterDeps,
  OnboardingProfileAdapter,
  CompleteOnboardingResult,
  GetMyProfileViewResult,
  GetPublicProfileViewResult,
  UpdateMyProfileResult,
  AttachProfileMediaRefResult,
  CompleteOnboardingInput,
  UpdatePrivateProfileInput,
  UpdatePersonalStatusInput,
  OwnerProfileView,
  PublicProfileView,
} from "./types";
