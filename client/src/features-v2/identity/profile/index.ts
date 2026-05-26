/**
 * features-v2/identity/profile — public entrypoint
 *
 * app-v2 consumes only this barrel. The backend identity domain is reached via
 * `profile-adapter.ts`, which is the only place allowed to import from
 * `@server/domains-v2/identity/public-api`.
 */
export { profileAdapter, createProfileAdapter } from "./profile-adapter";
export type {
  OnboardingProfileAdapter,
  CompleteOnboardingResult,
  GetPublicProfileResult,
  GetMyProfileResult,
  UpdateMyProfileResult,
  CompleteOnboardingInput,
  UpdatePrivateProfileInput,
} from "./types";
