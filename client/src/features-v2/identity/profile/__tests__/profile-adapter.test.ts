import { describe, expect, it } from "vitest";
import type {
  OwnerProfileView,
  ProfileApplicationPort,
} from "@shared/contracts/profile-view";
import {
  createProfileAdapter,
  createNotConnectedProfilePort,
  profileAdapter,
} from "../profile-adapter";

/**
 * The client profile adapter is a transport-neutral wrapper. The real identity +
 * media composition is tested server-side in
 * `server/application-v2/profile/__tests__/service.test.ts`. Here we verify the
 * client boundary: it forwards to a port, reports persistence honestly, and the
 * default adapter is an explicit not-connected stub (no server runtime bundled).
 */

const NOW = "2026-05-27T00:00:00.000Z";

function ownerView(profileUserId: string): OwnerProfileView {
  return {
    profileUserId,
    profileSlug: null,
    firstName: "Anna",
    lastName: "Kowalska",
    displayName: "Anna Kowalska",
    dateOfBirth: "1990-03-15",
    phone: "+48600999111",
    bio: "Hello",
    location: null,
    civilStatus: null,
    socialLinks: null,
    personalStatus: null,
    visibility: "public",
    onboardingCompleted: true,
    avatar: null,
    banner: null,
    createdAt: NOW,
    updatedAt: NOW,
    isOwner: true,
  };
}

function recordingPort(): { port: ProfileApplicationPort; calls: string[] } {
  const calls: string[] = [];
  const okOwner = (userId: string) =>
    Promise.resolve({ ok: true as const, value: ownerView(userId) });
  const port: ProfileApplicationPort = {
    getMyProfileView: (u) => {
      calls.push(`getMyProfileView:${u}`);
      return okOwner(u);
    },
    getPublicProfileView: async () => ({
      ok: false,
      error: { code: "PROFILE_NOT_FOUND", message: "n/a" },
    }),
    completeOnboarding: (u) => {
      calls.push(`completeOnboarding:${u}`);
      return okOwner(u);
    },
    updateMyProfile: (u) => okOwner(u),
    updatePersonalStatus: (u) => okOwner(u),
    clearPersonalStatus: (u) => okOwner(u),
    attachProfileAvatarRef: (u) => okOwner(u),
    attachProfileBannerRef: (u) => okOwner(u),
    attachProfileStatusPhotoRef: (u) => okOwner(u),
  };
  return { port, calls };
}

describe("createProfileAdapter (client boundary)", () => {
  it("reports the injected isPersistent flag", () => {
    const { port } = recordingPort();
    expect(createProfileAdapter({ port, isPersistent: true }).isPersistent()).toBe(true);
    expect(createProfileAdapter({ port, isPersistent: false }).isPersistent()).toBe(false);
  });

  it("forwards calls to the underlying port and returns its view", async () => {
    const { port, calls } = recordingPort();
    const adapter = createProfileAdapter({ port, isPersistent: false });
    const result = await adapter.getMyProfileView("u-1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.profileUserId).toBe("u-1");
    expect(calls).toContain("getMyProfileView:u-1");
  });
});

describe("default profileAdapter (transport not connected)", () => {
  it("isPersistent() is false — never fakes persistence", () => {
    expect(profileAdapter.isPersistent()).toBe(false);
  });

  it("getMyProfileView returns a typed not-connected error", async () => {
    const result = await profileAdapter.getMyProfileView("u-1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PROFILE_TRANSPORT_NOT_CONNECTED");
  });

  it("completeOnboarding returns a typed not-connected error", async () => {
    const result = await profileAdapter.completeOnboarding("u-1", {
      firstName: "A",
      lastName: "B",
      dateOfBirth: "1990-01-01",
      phone: "+48600000000",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PROFILE_TRANSPORT_NOT_CONNECTED");
  });

  it("the standalone not-connected port reports not-connected for every method", async () => {
    const port = createNotConnectedProfilePort();
    const results = await Promise.all([
      port.getPublicProfileView(null, "u-1"),
      port.updateMyProfile("u-1", {}),
      port.clearPersonalStatus("u-1"),
      port.attachProfileAvatarRef("u-1", "a"),
    ]);
    for (const r of results) {
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("PROFILE_TRANSPORT_NOT_CONNECTED");
    }
  });
});
