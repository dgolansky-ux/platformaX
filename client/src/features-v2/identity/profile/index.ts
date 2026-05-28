/**
 * features-v2/identity/profile — public entrypoint
 *
 * app-v2 consumes only this barrel. The backend identity + media domains are
 * intentionally unreachable from `client/**` (no `@server/*` imports, no
 * `@shared/wiring`). The default `profileAdapter` is a MOCK_LOCAL_ONLY adapter
 * that satisfies the same contract a future HTTP transport will, so UI screens
 * never branch on which backend is wired.
 */
export { profileAdapter, createMockProfileAdapter } from "./profile-adapter";
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
