/**
 * features-v2/identity — public feature entrypoint
 * Status: PARTIAL —
 *   - Auth: AUTH_RUNTIME_PARTIAL (real Supabase auth via adapter)
 *   - Profile: IDENTITY_PROFILE_RUNTIME_PARTIAL (in-memory boundary, see profile-adapter)
 *
 * app-v2 auth screens consume `identityAuthAdapter` from here. The Supabase
 * SDK is isolated to auth/supabase-client.ts and must not be imported
 * elsewhere.
 *
 * app-v2 onboarding/profile screens consume `profileAdapter` from here. The
 * backend domain (server/domains-v2/identity) is only reachable via this
 * adapter.
 */
import { createIdentityAuthAdapter } from "./auth/auth-adapter";
import { createSupabaseAuthBackend } from "./auth/supabase-client";

export const identityAuthAdapter = createIdentityAuthAdapter(
  createSupabaseAuthBackend(),
);

export { createIdentityAuthAdapter } from "./auth/auth-adapter";
export { createSupabaseAuthBackend } from "./auth/supabase-client";
export type {
  AuthUser,
  AuthError,
  AuthErrorCode,
  AuthResult,
  IdentityAuthAdapter,
  AuthBackend,
} from "./auth/types";

export { profileAdapter, createProfileAdapter } from "./profile";
export type {
  OnboardingProfileAdapter,
  CompleteOnboardingInput,
  CompleteOnboardingResult,
  GetMyProfileViewResult,
  GetPublicProfileViewResult,
  UpdateMyProfileResult,
  AttachProfileMediaRefResult,
  UpdatePrivateProfileInput,
  OwnerProfileView,
  PublicProfileView,
} from "./profile";
