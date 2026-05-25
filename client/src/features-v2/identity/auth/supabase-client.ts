/**
 * The ONLY module in the frontend allowed to import the Supabase SDK.
 *
 * It reads public frontend env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY),
 * creates a single client when both are present, and exposes an AuthBackend
 * implementation. When env is absent (tests, un-provisioned environments) the
 * client is null and isConfigured() returns false — no crash, no fake session.
 *
 * Only the anon (public) key is used here. The service role key and any direct
 * database connection string must never reach the frontend.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthBackend, BackendAuthResult, BackendError } from "./types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function createConfiguredClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}

const defaultClient = createConfiguredClient();

function toBackendError(error: { message: string; status?: number; code?: string } | null): BackendError | null {
  if (!error) return null;
  return { message: error.message, status: error.status, code: error.code };
}

function resetRedirectTo(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/login`;
}

export function createSupabaseAuthBackend(
  client: SupabaseClient | null = defaultClient,
): AuthBackend {
  return {
    isConfigured: () => client !== null,

    async signUp(email, password): Promise<BackendAuthResult> {
      if (!client) return { user: null, error: { message: "not configured" } };
      const { data, error } = await client.auth.signUp({ email, password });
      return { user: data.user, error: toBackendError(error) };
    },

    async signIn(email, password): Promise<BackendAuthResult> {
      if (!client) return { user: null, error: { message: "not configured" } };
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      return { user: data.user, error: toBackendError(error) };
    },

    async signOut() {
      if (!client) return { error: { message: "not configured" } };
      const { error } = await client.auth.signOut();
      return { error: toBackendError(error) };
    },

    async resetPassword(email) {
      if (!client) return { error: { message: "not configured" } };
      const redirectTo = resetRedirectTo();
      const { error } = await client.auth.resetPasswordForEmail(
        email,
        redirectTo ? { redirectTo } : undefined,
      );
      return { error: toBackendError(error) };
    },

    async getCurrentUser(): Promise<BackendAuthResult> {
      if (!client) return { user: null, error: null };
      const { data, error } = await client.auth.getUser();
      return { user: data.user, error: toBackendError(error) };
    },

    onAuthStateChange(listener) {
      if (!client) return () => {};
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        listener(session?.user ?? null);
      });
      return () => data.subscription.unsubscribe();
    },
  };
}
