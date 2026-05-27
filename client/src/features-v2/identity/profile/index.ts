/**
 * features-v2/identity/profile — public entrypoint
 *
 * app-v2 consumes only this barrel. All types come from the neutral wire
 * contract `@shared/contracts/profile-view`; the client never imports
 * `@server/*`. The backend identity + media composition lives server-side in
 * `server/application-v2/profile` and is reached only through a (future)
 * transport wired into `createProfileAdapter`.
 */
export {
  profileAdapter,
  createProfileAdapter,
  createNotConnectedProfilePort,
  CLIENT_PROFILE_TRANSPORT_NOT_CONNECTED,
} from "./profile-adapter";
export type {
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
