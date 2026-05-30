import type {
  AuthBackend,
  AuthError,
  AuthErrorCode,
  AuthResult,
  AuthUser,
  BackendAuthResult,
  BackendError,
  BackendUser,
  IdentityAuthAdapter,
  Unsubscribe,
} from "./types";

const NOT_CONFIGURED: AuthError = {
  code: "NOT_CONFIGURED",
  message:
    "Logowanie nie jest jeszcze skonfigurowane. Backend tożsamości nie jest jeszcze dostępny.",
};

function mapUser(user: BackendUser | null): AuthUser | null {
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

/**
 * Map a raw backend error to a safe, user-facing error. We never surface the
 * provider's raw message to the UI — only a curated Polish message + a stable
 * code. Classification is based on HTTP status and a coarse keyword match.
 */
function mapError(error: BackendError): AuthError {
  const status = error.status ?? 0;
  const haystack = `${error.code ?? ""} ${error.message}`.toLowerCase();

  let code: AuthErrorCode = "UNKNOWN";
  if (status === 429 || haystack.includes("rate")) {
    code = "RATE_LIMITED";
  } else if (
    haystack.includes("already registered") ||
    haystack.includes("already exists") ||
    haystack.includes("user already")
  ) {
    code = "EMAIL_IN_USE";
  } else if (haystack.includes("password") && haystack.includes("weak")) {
    code = "WEAK_PASSWORD";
  } else if (haystack.includes("password") && haystack.includes("least")) {
    code = "WEAK_PASSWORD";
  } else if (
    status === 400 ||
    status === 401 ||
    haystack.includes("invalid login") ||
    haystack.includes("invalid credentials")
  ) {
    code = "INVALID_CREDENTIALS";
  } else if (haystack.includes("fetch") || haystack.includes("network")) {
    code = "NETWORK";
  }

  return { code, message: messageFor(code) };
}

function messageFor(code: AuthErrorCode): string {
  switch (code) {
    case "NOT_CONFIGURED":
      return NOT_CONFIGURED.message;
    case "INVALID_CREDENTIALS":
      return "Nieprawidłowy e-mail lub hasło.";
    case "EMAIL_IN_USE":
      return "Ten adres e-mail jest już zarejestrowany.";
    case "WEAK_PASSWORD":
      return "Hasło jest zbyt słabe. Użyj co najmniej 8 znaków.";
    case "RATE_LIMITED":
      return "Zbyt wiele prób. Spróbuj ponownie za chwilę.";
    case "NETWORK":
      return "Problem z połączeniem. Sprawdź internet i spróbuj ponownie.";
    case "UNKNOWN":
    default:
      return "Coś poszło nie tak. Spróbuj ponownie.";
  }
}

function toResult(backendResult: BackendAuthResult): AuthResult {
  if (backendResult.error) {
    return { ok: false, error: mapError(backendResult.error) };
  }
  return { ok: true, user: mapUser(backendResult.user) };
}

export function createIdentityAuthAdapter(
  backend: AuthBackend,
): IdentityAuthAdapter {
  function guard(): AuthResult | null {
    if (!backend.isConfigured()) {
      return { ok: false, error: NOT_CONFIGURED };
    }
    return null;
  }

  return {
    isConfigured: () => backend.isConfigured(),

    async signUp(email, password) {
      return guard() ?? toResult(await backend.signUp(email, password));
    },

    async signIn(email, password) {
      return guard() ?? toResult(await backend.signIn(email, password));
    },

    async signOut() {
      const blocked = guard();
      if (blocked) return blocked;
      const { error } = await backend.signOut();
      if (error) return { ok: false, error: mapError(error) };
      return { ok: true, user: null };
    },

    async resetPassword(email) {
      const blocked = guard();
      if (blocked) return blocked;
      const { error } = await backend.resetPassword(email);
      if (error) return { ok: false, error: mapError(error) };
      return { ok: true, user: null };
    },

    async getCurrentUser() {
      if (!backend.isConfigured()) return null;
      const { user } = await backend.getCurrentUser();
      return mapUser(user);
    },

    onAuthStateChange(listener: (user: AuthUser | null) => void): Unsubscribe {
      if (!backend.isConfigured()) {
        return () => {};
      }
      return backend.onAuthStateChange((user) => listener(mapUser(user)));
    },
  };
}
