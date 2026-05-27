/**
 * application-v2/profile — service tests
 *
 * Verifies the composition behavior (identity + media), the safe error mapping
 * and PII discipline of the composed view DTOs. The service is exercised
 * end-to-end against the real identity + media in-memory adapters — that's the
 * runtime the frontend uses today.
 */
import { describe, expect, it } from "vitest";
import {
  createIdentityService,
  createInMemoryIdentityProfileRepository,
  type IdentityService,
} from "@server/domains-v2/identity/public-api";
import {
  createInMemoryMediaRepository,
  createMediaService,
  type MediaService,
  type MediaStoragePort,
  type UploadFileMeta,
} from "@server/domains-v2/media/public-api";
import {
  createProfileApplicationService,
  type ProfileApplicationService,
} from "../public-api";

const OWNER = "user-1";
const STRANGER = "user-2";
const NOW = "2026-05-25T12:00:00.000Z";

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

function buildService(): {
  app: ProfileApplicationService;
  identity: IdentityService;
  media: MediaService;
} {
  const identity = createIdentityService({
    repository: createInMemoryIdentityProfileRepository(),
    clock: () => NOW,
  });
  let assetCounter = 0;
  const media = createMediaService({
    repository: createInMemoryMediaRepository(),
    storage: connectedStorage(),
    clock: () => NOW,
    idGen: () => `asset-${++assetCounter}`,
  });
  const app = createProfileApplicationService({ identity, media });
  return { app, identity, media };
}

const ONBOARDING_INPUT = {
  firstName: "Anna",
  lastName: "Kowalska",
  dateOfBirth: "1990-03-15",
  phone: "+48600999111",
} as const;

const SAMPLE_AVATAR: UploadFileMeta = { mimeType: "image/png", sizeBytes: 1024 };
const SAMPLE_BANNER: UploadFileMeta = { mimeType: "image/webp", sizeBytes: 2048 };

describe("profile application service — getMyProfileView", () => {
  it("returns UNAUTHENTICATED when currentUserId is empty", async () => {
    const { app } = buildService();
    const result = await app.getMyProfileView("");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns PROFILE_NOT_FOUND when the owner has no profile yet", async () => {
    const { app } = buildService();
    const result = await app.getMyProfileView(OWNER);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PROFILE_NOT_FOUND");
  });

  it("composes identity + media into an owner view after onboarding", async () => {
    const { app } = buildService();
    await app.completeOnboarding(OWNER, ONBOARDING_INPUT);
    const result = await app.getMyProfileView(OWNER);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.userId).toBe(OWNER);
    expect(result.value.displayName).toBe("Anna Kowalska");
    expect(result.value.phone).toBe("+48600999111");
    expect(result.value.onboardingCompleted).toBe(true);
    expect(result.value.avatar).toBeNull();
    expect(result.value.banner).toBeNull();
    expect(result.value.isOwner).toBe(true);
  });
});

describe("profile application service — getPublicProfileView", () => {
  it("returns a PII-free public view to a stranger when visibility is public", async () => {
    const { app } = buildService();
    await app.completeOnboarding(OWNER, ONBOARDING_INPUT);
    const result = await app.getPublicProfileView(STRANGER, OWNER);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.displayName).toBe("Anna Kowalska");
    expect(result.value.isOwner).toBe(false);

    const keys = Object.keys(result.value);
    expect(keys).not.toContain("phone");
    expect(keys).not.toContain("dateOfBirth");
    expect(keys).not.toContain("email");

    const json = JSON.stringify(result.value);
    expect(json).not.toContain("+48600999111");
    expect(json).not.toContain("1990-03-15");
  });

  it("blocks strangers with PROFILE_FORBIDDEN when visibility is friends-only", async () => {
    const { app } = buildService();
    await app.completeOnboarding(OWNER, ONBOARDING_INPUT);
    await app.updateMyProfile(OWNER, { visibility: "friends" });
    const result = await app.getPublicProfileView(STRANGER, OWNER);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PROFILE_FORBIDDEN");
  });

  it("returns PROFILE_NOT_FOUND for an unknown profile", async () => {
    const { app } = buildService();
    const result = await app.getPublicProfileView(STRANGER, "ghost");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PROFILE_NOT_FOUND");
  });
});

describe("profile application service — completeOnboarding / updateMyProfile", () => {
  it("completeOnboarding persists identity and returns the composed owner view", async () => {
    const { app } = buildService();
    const result = await app.completeOnboarding(OWNER, ONBOARDING_INPUT);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.onboardingCompleted).toBe(true);
    expect(result.value.phone).toBe("+48600999111");
    expect(result.value.isOwner).toBe(true);
  });

  it("completeOnboarding maps invalid input to PROFILE_VALIDATION_FAILED with field errors", async () => {
    const { app } = buildService();
    const result = await app.completeOnboarding(OWNER, {
      firstName: "A",
      lastName: "",
      dateOfBirth: "not-a-date",
      phone: "abc",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PROFILE_VALIDATION_FAILED");
    expect(result.error.fields?.firstName).toBeTruthy();
    expect(result.error.fields?.lastName).toBeTruthy();
  });

  it("completeOnboarding twice maps to ONBOARDING_ALREADY_COMPLETED", async () => {
    const { app } = buildService();
    await app.completeOnboarding(OWNER, ONBOARDING_INPUT);
    const second = await app.completeOnboarding(OWNER, ONBOARDING_INPUT);
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe("ONBOARDING_ALREADY_COMPLETED");
  });

  it("updateMyProfile patches bio and returns the composed view", async () => {
    const { app } = buildService();
    await app.completeOnboarding(OWNER, ONBOARDING_INPUT);
    const result = await app.updateMyProfile(OWNER, { bio: "Nowe bio" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.bio).toBe("Nowe bio");
  });
});

describe("profile application service — attachProfileAvatarRef / attachProfileBannerRef", () => {
  async function readyAsset(
    media: MediaService,
    purpose: "avatar" | "banner",
    ownerId: string = OWNER,
  ): Promise<string> {
    const meta = purpose === "avatar" ? SAMPLE_AVATAR : SAMPLE_BANNER;
    const intent =
      purpose === "avatar"
        ? await media.createAvatarUploadIntent(ownerId, meta)
        : await media.createBannerUploadIntent(ownerId, meta);
    if (!intent.ok) throw new Error("intent failed");
    const confirmed = await media.confirmProfileMediaUpload(
      ownerId,
      intent.value.assetId,
    );
    if (!confirmed.ok) throw new Error("confirm failed");
    return intent.value.assetId;
  }

  it("attachProfileAvatarRef stores the ref and returns the composed view with avatar url", async () => {
    const { app, media } = buildService();
    await app.completeOnboarding(OWNER, ONBOARDING_INPUT);
    const assetId = await readyAsset(media, "avatar");
    const result = await app.attachProfileAvatarRef(OWNER, assetId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.avatar?.assetId).toBe(assetId);
    expect(result.value.avatar?.url).toContain("cdn.test");
  });

  it("attachProfileBannerRef stores the ref and returns the composed view with banner url", async () => {
    const { app, media } = buildService();
    await app.completeOnboarding(OWNER, ONBOARDING_INPUT);
    const assetId = await readyAsset(media, "banner");
    const result = await app.attachProfileBannerRef(OWNER, assetId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.banner?.assetId).toBe(assetId);
    expect(result.value.banner?.url).toContain("cdn.test");
  });

  it("rejects attaching a foreign asset as MEDIA_ASSET_FORBIDDEN", async () => {
    const { app, media } = buildService();
    await app.completeOnboarding(OWNER, ONBOARDING_INPUT);
    const foreignAssetId = await readyAsset(media, "avatar", STRANGER);
    const result = await app.attachProfileAvatarRef(OWNER, foreignAssetId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("MEDIA_ASSET_FORBIDDEN");
  });

  it("rejects attaching an avatar asset as a banner ref as MEDIA_ASSET_TYPE_MISMATCH", async () => {
    const { app, media } = buildService();
    await app.completeOnboarding(OWNER, ONBOARDING_INPUT);
    const assetId = await readyAsset(media, "avatar");
    const result = await app.attachProfileBannerRef(OWNER, assetId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("MEDIA_ASSET_TYPE_MISMATCH");
  });

  it("rejects attaching a pending (not ready) asset as MEDIA_ASSET_NOT_READY", async () => {
    const { app, media } = buildService();
    await app.completeOnboarding(OWNER, ONBOARDING_INPUT);
    const intent = await media.createAvatarUploadIntent(OWNER, SAMPLE_AVATAR);
    if (!intent.ok) throw new Error("intent failed");
    const result = await app.attachProfileAvatarRef(OWNER, intent.value.assetId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("MEDIA_ASSET_NOT_READY");
  });

  it("rejects attaching an unknown asset as MEDIA_ASSET_NOT_FOUND", async () => {
    const { app } = buildService();
    await app.completeOnboarding(OWNER, ONBOARDING_INPUT);
    const result = await app.attachProfileAvatarRef(OWNER, "missing-asset");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("MEDIA_ASSET_NOT_FOUND");
  });
});

describe("profile application service — personal status", () => {
  async function ready() {
    const { app, media } = buildService();
    await app.completeOnboarding(OWNER, ONBOARDING_INPUT);
    return { app, media };
  }

  it("updatePersonalStatus persists text/visibility and composes them into the owner view", async () => {
    const { app } = await ready();
    const result = await app.updatePersonalStatus(OWNER, {
      text: "produktywna",
      emoji: "🚀",
      description: "skupiona na release",
      visibility: "public",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.personalStatus?.text).toBe("produktywna");
    expect(result.value.personalStatus?.visibility).toBe("public");
    expect(result.value.personalStatus?.photo).toBeNull();
  });

  it("updatePersonalStatus maps text validation failure to PROFILE_VALIDATION_FAILED", async () => {
    const { app } = await ready();
    const result = await app.updatePersonalStatus(OWNER, {
      text: "",
      visibility: "public",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PROFILE_VALIDATION_FAILED");
    expect(result.error.fields?.text).toBeTruthy();
  });

  it("clearPersonalStatus removes the status block from the owner view", async () => {
    const { app } = await ready();
    await app.updatePersonalStatus(OWNER, { text: "tymczasowy", visibility: "public" });
    const cleared = await app.clearPersonalStatus(OWNER);
    expect(cleared.ok).toBe(true);
    if (!cleared.ok) return;
    expect(cleared.value.personalStatus).toBeNull();
  });

  it("attachProfileStatusPhotoRef verifies media owner + purpose + ready, then stores the ref", async () => {
    const { app, media } = await ready();
    await app.updatePersonalStatus(OWNER, { text: "skupiona", visibility: "public" });
    const intent = await media.createStatusPhotoUploadIntent(OWNER, {
      mimeType: "image/png",
      sizeBytes: 1024,
    });
    if (!intent.ok) throw new Error("intent failed");
    const confirmed = await media.confirmProfileMediaUpload(OWNER, intent.value.assetId);
    if (!confirmed.ok) throw new Error("confirm failed");
    const result = await app.attachProfileStatusPhotoRef(OWNER, intent.value.assetId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.personalStatus?.photo?.assetId).toBe(intent.value.assetId);
    expect(result.value.personalStatus?.photo?.url).toContain("cdn.test");
  });

  it("attachProfileStatusPhotoRef rejects a foreign asset (MEDIA_ASSET_FORBIDDEN)", async () => {
    const { app, media } = await ready();
    await app.updatePersonalStatus(OWNER, { text: "skupiona", visibility: "public" });
    const intent = await media.createStatusPhotoUploadIntent(STRANGER, {
      mimeType: "image/png",
      sizeBytes: 1024,
    });
    if (!intent.ok) throw new Error("intent failed");
    const confirmed = await media.confirmProfileMediaUpload(STRANGER, intent.value.assetId);
    if (!confirmed.ok) throw new Error("confirm failed");
    const result = await app.attachProfileStatusPhotoRef(OWNER, intent.value.assetId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("MEDIA_ASSET_FORBIDDEN");
  });

  it("attachProfileStatusPhotoRef rejects an avatar-purpose asset as MEDIA_ASSET_TYPE_MISMATCH", async () => {
    const { app, media } = await ready();
    await app.updatePersonalStatus(OWNER, { text: "skupiona", visibility: "public" });
    const intent = await media.createAvatarUploadIntent(OWNER, {
      mimeType: "image/png",
      sizeBytes: 1024,
    });
    if (!intent.ok) throw new Error("intent failed");
    const confirmed = await media.confirmProfileMediaUpload(OWNER, intent.value.assetId);
    if (!confirmed.ok) throw new Error("confirm failed");
    const result = await app.attachProfileStatusPhotoRef(OWNER, intent.value.assetId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("MEDIA_ASSET_TYPE_MISMATCH");
  });

  it("getPublicProfileView hides a private status from strangers", async () => {
    const { app } = await ready();
    await app.updatePersonalStatus(OWNER, { text: "ukryte", visibility: "private" });
    const result = await app.getPublicProfileView(STRANGER, OWNER);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.personalStatus).toBeNull();
  });

  it("updateMyProfile patches the new core fields (location, slug, civilStatus, socialLinks)", async () => {
    const { app } = await ready();
    const result = await app.updateMyProfile(OWNER, {
      location: "Kraków",
      profileSlug: "anna-k",
      civilStatus: "partnered",
      socialLinks: { linkedin: "https://linkedin.com/in/anna" },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.location).toBe("Kraków");
    expect(result.value.profileSlug).toBe("anna-k");
    expect(result.value.civilStatus).toBe("partnered");
    expect(result.value.socialLinks?.linkedin).toBe("https://linkedin.com/in/anna");
  });
});
