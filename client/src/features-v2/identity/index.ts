/**
 * features-v2/identity — public feature entrypoint
 * Status: PARTIAL — real Supabase auth runtime via adapter; profile backend not started.
 *
 * app-v2 auth screens consume `identityAuthAdapter` from here. The Supabase SDK
 * is isolated to auth/supabase-client.ts and must not be imported elsewhere.
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
