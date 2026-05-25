import { describe, expect, test, vi } from "vitest";
import { createIdentityAuthAdapter } from "../auth-adapter";
import type {
  AuthBackend,
  AuthUser,
  BackendAuthResult,
  BackendError,
  BackendUser,
} from "../types";

type BackendOverrides = Partial<AuthBackend>;

function buildBackend(overrides: BackendOverrides = {}): AuthBackend {
  const ok: BackendAuthResult = { user: null, error: null };
  return {
    isConfigured: () => true,
    signUp: vi.fn(async (): Promise<BackendAuthResult> => ok),
    signIn: vi.fn(async (): Promise<BackendAuthResult> => ok),
    signOut: vi.fn(async () => ({ error: null })),
    resetPassword: vi.fn(async () => ({ error: null })),
    getCurrentUser: vi.fn(async (): Promise<BackendAuthResult> => ok),
    onAuthStateChange: vi.fn(() => () => {}),
    ...overrides,
  };
}

const USER: BackendUser = { id: "u-1", email: "anna@example.org" };

describe("createIdentityAuthAdapter", () => {
  test("signUp forwards credentials to the backend and maps the user", async () => {
    const backend = buildBackend({
      signUp: vi.fn(async (): Promise<BackendAuthResult> => ({ user: USER, error: null })),
    });
    const adapter = createIdentityAuthAdapter(backend);

    const result = await adapter.signUp("anna@example.org", "haslo1234");

    expect(backend.signUp).toHaveBeenCalledWith("anna@example.org", "haslo1234");
    expect(result).toEqual({ ok: true, user: { id: "u-1", email: "anna@example.org" } });
  });

  test("signIn forwards credentials to the backend", async () => {
    const backend = buildBackend({
      signIn: vi.fn(async (): Promise<BackendAuthResult> => ({ user: USER, error: null })),
    });
    const adapter = createIdentityAuthAdapter(backend);

    const result = await adapter.signIn("anna@example.org", "haslo1234");

    expect(backend.signIn).toHaveBeenCalledWith("anna@example.org", "haslo1234");
    expect(result.ok).toBe(true);
  });

  test("resetPassword forwards the e-mail to the backend", async () => {
    const backend = buildBackend();
    const adapter = createIdentityAuthAdapter(backend);

    const result = await adapter.resetPassword("anna@example.org");

    expect(backend.resetPassword).toHaveBeenCalledWith("anna@example.org");
    expect(result.ok).toBe(true);
  });

  test("signOut delegates to the backend", async () => {
    const backend = buildBackend();
    const adapter = createIdentityAuthAdapter(backend);

    const result = await adapter.signOut();

    expect(backend.signOut).toHaveBeenCalledOnce();
    expect(result).toEqual({ ok: true, user: null });
  });

  test("getCurrentUser maps the backend user", async () => {
    const backend = buildBackend({
      getCurrentUser: vi.fn(async (): Promise<BackendAuthResult> => ({ user: USER, error: null })),
    });
    const adapter = createIdentityAuthAdapter(backend);

    expect(await adapter.getCurrentUser()).toEqual({ id: "u-1", email: "anna@example.org" });
  });

  test("onAuthStateChange maps the backend user before notifying the listener", () => {
    const captured: Array<(user: BackendUser | null) => void> = [];
    const backend = buildBackend({
      onAuthStateChange: (listener) => {
        captured.push(listener);
        return () => {};
      },
    });
    const adapter = createIdentityAuthAdapter(backend);

    const seen: Array<AuthUser | null> = [];
    adapter.onAuthStateChange((user) => seen.push(user));
    const notify = captured[0];
    notify(USER);
    notify(null);

    expect(seen).toEqual([{ id: "u-1", email: "anna@example.org" }, null]);
  });

  test("maps invalid-credentials backend error to a safe Polish message", async () => {
    const error: BackendError = { message: "Invalid login credentials", status: 400 };
    const backend = buildBackend({
      signIn: vi.fn(async (): Promise<BackendAuthResult> => ({ user: null, error })),
    });
    const adapter = createIdentityAuthAdapter(backend);

    const result = await adapter.signIn("anna@example.org", "wrong");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_CREDENTIALS");
      expect(result.error.message).toMatch(/nieprawidłowy/i);
      // raw provider message must not leak to the UI
      expect(result.error.message).not.toMatch(/invalid login credentials/i);
    }
  });

  test("maps already-registered backend error to EMAIL_IN_USE", async () => {
    const error: BackendError = { message: "User already registered", status: 422 };
    const backend = buildBackend({
      signUp: vi.fn(async (): Promise<BackendAuthResult> => ({ user: null, error })),
    });
    const adapter = createIdentityAuthAdapter(backend);

    const result = await adapter.signUp("anna@example.org", "haslo1234");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("EMAIL_IN_USE");
  });

  test("returns NOT_CONFIGURED without calling the backend when not configured", async () => {
    const backend = buildBackend({ isConfigured: () => false });
    const adapter = createIdentityAuthAdapter(backend);

    const result = await adapter.signUp("anna@example.org", "haslo1234");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_CONFIGURED");
    expect(backend.signUp).not.toHaveBeenCalled();
  });

  test("isConfigured reflects the backend", () => {
    expect(createIdentityAuthAdapter(buildBackend()).isConfigured()).toBe(true);
    expect(
      createIdentityAuthAdapter(buildBackend({ isConfigured: () => false })).isConfigured(),
    ).toBe(false);
  });
});
