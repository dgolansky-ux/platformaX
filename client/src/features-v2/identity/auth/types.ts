/**
 * features-v2/identity — auth contracts
 *
 * Layering: UI -> IdentityAuthAdapter -> AuthBackend -> Supabase SDK.
 * The Supabase SDK is touched only by the AuthBackend implementation in
 * supabase-client.ts. Everything above depends on these typed contracts.
 */

/** Authenticated subject as exposed to the V2 frontend. */
export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthErrorCode =
  | "NOT_CONFIGURED"
  | "INVALID_CREDENTIALS"
  | "EMAIL_IN_USE"
  | "WEAK_PASSWORD"
  | "RATE_LIMITED"
  | "NETWORK"
  | "UNKNOWN";

/** Safe, user-facing auth error. Never carries provider internals or secrets. */
export type AuthError = {
  code: AuthErrorCode;
  message: string;
};

export type AuthResult =
  | { ok: true; user: AuthUser | null }
  | { ok: false; error: AuthError };

export type Unsubscribe = () => void;

/**
 * Minimal backend contract the adapter depends on. Implemented by the Supabase
 * wrapper for runtime and by typed fakes in tests — so the adapter can be unit
 * tested without the SDK or any network.
 */
export type BackendUser = { id: string; email?: string | null };

export type BackendError = {
  message: string;
  status?: number;
  code?: string;
};

export type BackendAuthResult = {
  user: BackendUser | null;
  error: BackendError | null;
};

export interface AuthBackend {
  isConfigured(): boolean;
  signUp(email: string, password: string): Promise<BackendAuthResult>;
  signIn(email: string, password: string): Promise<BackendAuthResult>;
  signOut(): Promise<{ error: BackendError | null }>;
  resetPassword(email: string): Promise<{ error: BackendError | null }>;
  getCurrentUser(): Promise<BackendAuthResult>;
  onAuthStateChange(listener: (user: BackendUser | null) => void): Unsubscribe;
}

/** Public auth surface consumed by the identity UI feature and app-v2 auth screens. */
export interface IdentityAuthAdapter {
  isConfigured(): boolean;
  signUp(email: string, password: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<AuthResult>;
  resetPassword(email: string): Promise<AuthResult>;
  getCurrentUser(): Promise<AuthUser | null>;
  onAuthStateChange(listener: (user: AuthUser | null) => void): Unsubscribe;
}
