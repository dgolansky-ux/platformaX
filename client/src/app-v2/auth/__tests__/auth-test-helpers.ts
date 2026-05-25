import { vi } from "vitest";
import type { AuthResult, IdentityAuthAdapter } from "../../../features-v2/identity";

const OK: AuthResult = { ok: true, user: null };

/**
 * Typed fake of the identity auth adapter for UI tests. Defaults to a configured
 * adapter whose calls succeed; override individual methods per test.
 */
export function makeFakeAuthAdapter(
  overrides: Partial<IdentityAuthAdapter> = {},
): IdentityAuthAdapter {
  return {
    isConfigured: () => true,
    signUp: vi.fn(async (): Promise<AuthResult> => OK),
    signIn: vi.fn(async (): Promise<AuthResult> => OK),
    signOut: vi.fn(async (): Promise<AuthResult> => OK),
    resetPassword: vi.fn(async (): Promise<AuthResult> => OK),
    getCurrentUser: vi.fn(async () => null),
    onAuthStateChange: vi.fn(() => () => {}),
    ...overrides,
  };
}
