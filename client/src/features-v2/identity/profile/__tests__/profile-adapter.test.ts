import { describe, expect, it } from "vitest";
import {
  createIdentityService,
  createInMemoryIdentityProfileRepository,
} from "@server/domains-v2/identity/public-api";
import {
  createInMemoryMediaRepository,
  createMediaService,
  type MediaStoragePort,
} from "@server/domains-v2/media/public-api";
import { createProfileApplicationService } from "@server/application-v2/profile/public-api";
import { createProfileAdapter } from "../profile-adapter";

function connectedStorage(): MediaStoragePort {
  return {
    provider: "test-storage",
    isConnected: () => true,
    async createUploadTarget(req) {
      return {
        provider: "test-storage",
        uploadUrl: `https://storage.test/${req.storageKey}?sig=x`,
        publicUrl: `https://cdn.test/${req.storageKey}`,
        transport: "READY",
        expiresAt: null,
      };
    },
  };
}

describe("profileAdapter (frontend boundary)", () => {
  function buildAdapter() {
    const identity = createIdentityService({
      repository: createInMemoryIdentityProfileRepository(),
      clock: () => "2026-05-25T12:00:00.000Z",
    });
    let assetCounter = 0;
    const media = createMediaService({
      repository: createInMemoryMediaRepository(),
      storage: connectedStorage(),
      clock: () => "2026-05-25T12:00:00.000Z",
      idGen: () => `asset-${++assetCounter}`,
    });
    const service = createProfileApplicationService({ identity, media });
    return { adapter: createProfileAdapter({ service, isPersistent: false }), media };
  }

  async function seedOnboarded(adapter: ReturnType<typeof buildAdapter>["adapter"]) {
    return adapter.completeOnboarding("u-1", {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
  }

  it("reports isPersistent honestly while running in-memory", () => {
    const { adapter } = buildAdapter();
    expect(adapter.isPersistent()).toBe(false);
  });

  it("completeOnboarding writes through the application service and returns the composed owner view", async () => {
    const { adapter } = buildAdapter();
    const result = await adapter.completeOnboarding("u-1", {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.onboardingCompleted).toBe(true);
    expect(result.value.userId).toBe("u-1");
    expect(result.value.isOwner).toBe(true);
  });

  it("getPublicProfileView after onboarding never returns PII", async () => {
    const { adapter } = buildAdapter();
    await seedOnboarded(adapter);
    const result = await adapter.getPublicProfileView("viewer-2", "u-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const json = JSON.stringify(result.value);
    expect(json).not.toContain("+48600999111");
    expect(json).not.toContain("1990-03-15");
    expect(Object.keys(result.value)).not.toContain("phone");
    expect(Object.keys(result.value)).not.toContain("dateOfBirth");
  });

  it("getMyProfileView returns the owner-only view with private fields", async () => {
    const { adapter } = buildAdapter();
    await seedOnboarded(adapter);
    const result = await adapter.getMyProfileView("u-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.phone).toBe("+48600999111");
    expect(result.value.dateOfBirth).toBe("1990-03-15");
    expect(result.value.isOwner).toBe(true);
  });

  it("updateMyProfile patches bio through the application boundary", async () => {
    const { adapter } = buildAdapter();
    await seedOnboarded(adapter);
    const updated = await adapter.updateMyProfile("u-1", { bio: "Hello world" });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.bio).toBe("Hello world");

    const fetched = await adapter.getMyProfileView("u-1");
    expect(fetched.ok).toBe(true);
    if (!fetched.ok) return;
    expect(fetched.value.bio).toBe("Hello world");
  });

  it("attachProfileAvatarRef stores the ref and resolves the public URL via media", async () => {
    const { adapter, media } = buildAdapter();
    await seedOnboarded(adapter);
    const intent = await media.createAvatarUploadIntent("u-1", {
      mimeType: "image/png",
      sizeBytes: 1024,
    });
    if (!intent.ok) throw new Error("intent failed");
    const confirmed = await media.confirmProfileMediaUpload("u-1", intent.value.assetId);
    if (!confirmed.ok) throw new Error("confirm failed");
    const attached = await adapter.attachProfileAvatarRef("u-1", intent.value.assetId);
    expect(attached.ok).toBe(true);
    if (!attached.ok) return;
    expect(attached.value.avatar?.assetId).toBe(intent.value.assetId);
    expect(attached.value.avatar?.url).toContain("cdn.test");
  });

  it("attachProfileAvatarRef rejects a foreign asset as MEDIA_ASSET_FORBIDDEN", async () => {
    const { adapter, media } = buildAdapter();
    await seedOnboarded(adapter);
    const intent = await media.createAvatarUploadIntent("intruder", {
      mimeType: "image/png",
      sizeBytes: 1024,
    });
    if (!intent.ok) throw new Error("intent failed");
    const confirmed = await media.confirmProfileMediaUpload(
      "intruder",
      intent.value.assetId,
    );
    if (!confirmed.ok) throw new Error("confirm failed");
    const result = await adapter.attachProfileAvatarRef("u-1", intent.value.assetId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("MEDIA_ASSET_FORBIDDEN");
  });

  it("updateMyProfile surfaces validation errors as a typed application failure", async () => {
    const { adapter } = buildAdapter();
    await seedOnboarded(adapter);
    const longBio = "x".repeat(200);
    const result = await adapter.updateMyProfile("u-1", { bio: longBio });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PROFILE_VALIDATION_FAILED");
    expect(result.error.fields?.bio).toContain("175");
  });

  it("updateMyProfile PROFILE_NOT_FOUND when there is no profile", async () => {
    const { adapter } = buildAdapter();
    const result = await adapter.updateMyProfile("nobody", { bio: "x" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PROFILE_NOT_FOUND");
  });
});
