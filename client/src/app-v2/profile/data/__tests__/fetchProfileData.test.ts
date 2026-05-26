/**
 * Tests the auth-gated state machine in `fetchProfileDataOnce` against a fully
 * faked profile adapter that satisfies the application-boundary contract. The
 * real composition of identity + media (and the cross-domain wiring) is
 * exercised by `server/application-v2/profile/__tests__/service.test.ts` and
 * `client/src/features-v2/identity/profile/__tests__/profile-adapter.test.ts`,
 * so app-v2 tests stay free of backend imports (`PX-ARCH-006`).
 */
import { describe, expect, it } from "vitest";
import type {
  IdentityAuthAdapter,
  OnboardingProfileAdapter,
  OwnerProfileView,
} from "../../../../features-v2/identity";
import { fetchProfileDataOnce } from "../fetchProfileData";

const NOW = "2026-05-25T12:00:00.000Z";

function ownerViewFor(userId: string): OwnerProfileView {
  return {
    userId,
    firstName: "Anna",
    lastName: "Kowalska",
    displayName: "Anna Kowalska",
    dateOfBirth: "1990-03-15",
    phone: "+48600999111",
    bio: null,
    visibility: "public",
    onboardingCompleted: true,
    avatar: { assetId: "asset-avatar", url: "https://cdn.example/avatar.jpg" },
    banner: null,
    createdAt: NOW,
    updatedAt: NOW,
    isOwner: true,
  };
}

function fakeAuth(
  user: { id: string; email: string | null } | null,
): IdentityAuthAdapter {
  return {
    isConfigured: () => true,
    signUp: async () => ({ ok: true, user }),
    signIn: async () => ({ ok: true, user }),
    signOut: async () => ({ ok: true, user: null }),
    resetPassword: async () => ({ ok: true, user: null }),
    getCurrentUser: async () => user,
    onAuthStateChange: () => () => {},
  };
}

function buildProfileAdapter(
  overrides: Partial<OnboardingProfileAdapter> = {},
): OnboardingProfileAdapter {
  const notFound = {
    ok: false as const,
    error: { code: "PROFILE_NOT_FOUND" as const, message: "n/a" },
  };
  return {
    isPersistent: () => false,
    completeOnboarding: async () => notFound,
    getMyProfileView: async () => notFound,
    getPublicProfileView: async () => notFound,
    updateMyProfile: async () => notFound,
    attachProfileAvatarRef: async () => notFound,
    attachProfileBannerRef: async () => notFound,
    ...overrides,
  };
}

describe("fetchProfileDataOnce", () => {
  it("returns anonymous when there is no authenticated user", async () => {
    const state = await fetchProfileDataOnce({
      auth: fakeAuth(null),
      profile: buildProfileAdapter(),
    });
    expect(state.kind).toBe("anonymous");
  });

  it("returns empty when the user has no profile yet (PROFILE_NOT_FOUND)", async () => {
    const state = await fetchProfileDataOnce({
      auth: fakeAuth({ id: "u-1", email: "u@example.com" }),
      profile: buildProfileAdapter(),
    });
    expect(state.kind).toBe("empty");
    if (state.kind !== "empty") return;
    expect(state.userId).toBe("u-1");
  });

  it("returns ready with the composed owner view from the application boundary", async () => {
    const profile = buildProfileAdapter({
      getMyProfileView: async (userId: string) => ({
        ok: true,
        value: ownerViewFor(userId),
      }),
    });
    const state = await fetchProfileDataOnce({
      auth: fakeAuth({ id: "u-1", email: "u@example.com" }),
      profile,
    });
    expect(state.kind).toBe("ready");
    if (state.kind !== "ready") return;
    expect(state.userId).toBe("u-1");
    expect(state.view.displayName).toBe("Anna Kowalska");
    expect(state.view.avatarUrl).toBe("https://cdn.example/avatar.jpg");
    expect(state.isPersistent).toBe(false);
    // The view-model never carries PII from the underlying owner view.
    const json = JSON.stringify(state.view);
    expect(json).not.toContain("+48600999111");
    expect(json).not.toContain("1990-03-15");
  });

  it("surfaces non-PROFILE_NOT_FOUND application errors as error state", async () => {
    const profile = buildProfileAdapter({
      getMyProfileView: async () => ({
        ok: false,
        error: { code: "PROFILE_FORBIDDEN", message: "Brak uprawnień" },
      }),
    });
    const state = await fetchProfileDataOnce({
      auth: fakeAuth({ id: "u-1", email: null }),
      profile,
    });
    expect(state.kind).toBe("error");
    if (state.kind !== "error") return;
    expect(state.message).toBe("Brak uprawnień");
  });

  it("treats thrown errors from adapters as error state with the message", async () => {
    const exploding: IdentityAuthAdapter = {
      ...fakeAuth({ id: "u-1", email: null }),
      getCurrentUser: async () => {
        throw new Error("network down");
      },
    };
    const state = await fetchProfileDataOnce({
      auth: exploding,
      profile: buildProfileAdapter(),
    });
    expect(state.kind).toBe("error");
    if (state.kind !== "error") return;
    expect(state.message).toBe("network down");
  });
});
