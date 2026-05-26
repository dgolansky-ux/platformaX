import { describe, expect, it } from "vitest";
import {
  createIdentityService,
  createInMemoryIdentityProfileRepository,
} from "@server/domains-v2/identity/public-api";
import type {
  IdentityAuthAdapter,
  OnboardingProfileAdapter,
} from "../../../../features-v2/identity";
import { createProfileAdapter } from "../../../../features-v2/identity/profile/profile-adapter";
import type { MediaUploadAdapter } from "../../../../features-v2/media";
import { fetchProfileDataOnce } from "../fetchProfileData";

function buildProfile(): OnboardingProfileAdapter {
  const repository = createInMemoryIdentityProfileRepository();
  const service = createIdentityService({
    repository,
    clock: () => "2026-05-25T12:00:00.000Z",
  });
  return createProfileAdapter({ service, isPersistent: false });
}

function fakeAuth(user: { id: string; email: string | null } | null): IdentityAuthAdapter {
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

function fakeMedia(urls: Record<string, string> = {}): MediaUploadAdapter {
  return {
    isStorageConnected: () => false,
    createAvatarUploadIntent: async () => {
      throw new Error("not used");
    },
    createBannerUploadIntent: async () => {
      throw new Error("not used");
    },
    confirmProfileMediaUpload: async () => {
      throw new Error("not used");
    },
    getPublicMediaUrl: async (ref) => ({
      ok: true,
      value: {
        assetId: ref.assetId,
        purpose: "avatar",
        status: urls[ref.assetId] ? "ready" : "pending",
        url: urls[ref.assetId] ?? null,
        mimeType: "image/jpeg",
        width: null,
        height: null,
      },
    }),
  };
}

describe("fetchProfileDataOnce", () => {
  it("returns anonymous when there is no authenticated user", async () => {
    const state = await fetchProfileDataOnce({
      auth: fakeAuth(null),
      profile: buildProfile(),
      media: fakeMedia(),
    });
    expect(state.kind).toBe("anonymous");
  });

  it("returns empty when the user has no profile yet", async () => {
    const state = await fetchProfileDataOnce({
      auth: fakeAuth({ id: "u-1", email: "u@example.com" }),
      profile: buildProfile(),
      media: fakeMedia(),
    });
    expect(state.kind).toBe("empty");
    if (state.kind !== "empty") return;
    expect(state.userId).toBe("u-1");
  });

  it("returns ready with the owner view after onboarding", async () => {
    const profile = buildProfile();
    await profile.completeOnboarding("u-1", {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
      avatarMediaRef: { assetId: "asset-avatar" },
    });
    const media = fakeMedia({ "asset-avatar": "https://cdn.example/avatar.jpg" });

    const state = await fetchProfileDataOnce({
      auth: fakeAuth({ id: "u-1", email: "u@example.com" }),
      profile,
      media,
    });
    expect(state.kind).toBe("ready");
    if (state.kind !== "ready") return;
    expect(state.userId).toBe("u-1");
    expect(state.view.displayName).toBe("Anna Kowalska");
    expect(state.view.avatarUrl).toBe("https://cdn.example/avatar.jpg");
    expect(state.isPersistent).toBe(false);
    const json = JSON.stringify(state.view);
    expect(json).not.toContain("+48600999111");
    expect(json).not.toContain("1990-03-15");
  });

  it("surfaces non-NOT_FOUND identity errors as error state", async () => {
    const explosive: OnboardingProfileAdapter = {
      isPersistent: () => false,
      completeOnboarding: async () => ({
        ok: false,
        error: { code: "INVALID_INPUT", message: "x" },
      }),
      getMyProfile: async () => ({
        ok: false,
        error: { code: "FORBIDDEN", message: "Brak uprawnień" },
      }),
      getPublicProfile: async () => ({
        ok: false,
        error: { code: "FORBIDDEN", message: "x" },
      }),
      updateMyProfile: async () => ({
        ok: false,
        error: { code: "FORBIDDEN", message: "x" },
      }),
    };
    const state = await fetchProfileDataOnce({
      auth: fakeAuth({ id: "u-1", email: null }),
      profile: explosive,
      media: fakeMedia(),
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
      profile: buildProfile(),
      media: fakeMedia(),
    });
    expect(state.kind).toBe("error");
    if (state.kind !== "error") return;
    expect(state.message).toBe("network down");
  });
});
