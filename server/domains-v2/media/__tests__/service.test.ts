import { describe, it, expect } from "vitest";
import {
  createMediaService,
  type MediaStoragePort,
  type UploadFileMeta,
} from "../public-api";
import {
  createInMemoryMediaRepository,
  createInMemoryUploadIntentRepository,
  createEnvRequiredStoragePort,
} from "../repository";

function deps(storage: MediaStoragePort) {
  let n = 0;
  return {
    repository: createInMemoryMediaRepository(),
    intentRepository: createInMemoryUploadIntentRepository(),
    storage,
    clock: () => "2026-05-25T00:00:00.000Z",
    idGen: () => `gen-${++n}`,
  };
}

function connectedStorage(): MediaStoragePort {
  return {
    provider: "test-storage",
    isConnected: () => true,
    async createUploadTarget(req) {
      return {
        provider: "test-storage",
        uploadUrl: `https://storage.test/${req.storageKey}?sig=x`,
        publicUrl: `https://cdn.test/${req.storageKey}`,
        cdnUrl: null,
        transport: "READY",
        expiresAt: "2026-05-25T01:00:00.000Z",
      };
    },
  };
}

const goodAvatar: UploadFileMeta = { mimeType: "image/png", sizeBytes: 1024 };
const goodBanner: UploadFileMeta = { mimeType: "image/webp", sizeBytes: 2048 };

function profileIntent(meta: UploadFileMeta, actor = "user-1") {
  return {
    actorUserId: actor,
    ownerRef: { ownerType: "user_profile" as const, ownerId: actor },
    purpose: "profile_avatar" as const,
    fileMeta: meta,
    idempotencyKey: `idem-${meta.mimeType}-${meta.sizeBytes}-${actor}`,
  };
}

function bannerIntent(meta: UploadFileMeta, actor = "user-1") {
  return {
    ...profileIntent(meta, actor),
    purpose: "profile_banner" as const,
  };
}

describe("media service — upload intents (V2 generic)", () => {
  it("requires an actor (userId)", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const res = await svc.createUploadIntent(profileIntent(goodAvatar, ""));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("creates an avatar intent for a valid image and owner", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const res = await svc.createUploadIntent(profileIntent(goodAvatar));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.purpose).toBe("profile_avatar");
      expect(res.value.mimeType).toBe("image/png");
      expect(res.value.transport).toBe("READY");
      expect(res.value.uploadUrl).toContain("storage.test");
      expect(res.value.storageKey).toContain("user_profile/user-1/profile_avatar/");
      expect(res.value.maxFiles).toBe(1);
      expect(res.value.allowedMimeTypes).toContain("image/png");
    }
  });

  it("rejects an unsupported mime type", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const res = await svc.createUploadIntent(
      profileIntent({ mimeType: "image/svg+xml", sizeBytes: 1024 }),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("UNSUPPORTED_TYPE");
  });

  it("rejects a file larger than the avatar limit", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const res = await svc.createUploadIntent(
      profileIntent({ mimeType: "image/png", sizeBytes: 50 * 1024 * 1024 }),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("TOO_LARGE");
  });

  it("rejects an inline data: scheme source ref", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const inlineRef = "data:image/png;" + "x".repeat(8);
    const res = await svc.createUploadIntent(
      profileIntent({ mimeType: "image/png", sizeBytes: 1024, sourceUri: inlineRef }),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("INVALID_INPUT");
  });

  it("rejects an owner type that does not match the purpose", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const bad = {
      ...profileIntent(goodAvatar),
      ownerRef: { ownerType: "community" as const, ownerId: "comm-1" },
    };
    const res = await svc.createUploadIntent(bad);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("INVALID_OWNER_TYPE");
  });

  it("idempotent retry returns the same intent", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const intent = profileIntent(goodAvatar);
    const a = await svc.createUploadIntent(intent);
    const b = await svc.createUploadIntent(intent);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(b.value.intentId).toBe(a.value.intentId);
      expect(b.value.assetId).toBe(a.value.assetId);
    }
  });
});

describe("media service — complete + read + variants", () => {
  it("with connected storage, completeUpload marks the asset ready and resolves a URL", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const intent = await svc.createUploadIntent(profileIntent(goodAvatar));
    expect(intent.ok).toBe(true);
    if (!intent.ok) return;

    const completed = await svc.completeUpload({
      actorUserId: "user-1",
      intentId: intent.value.intentId,
      assetId: intent.value.assetId,
    });
    expect(completed.ok).toBe(true);
    if (completed.ok) {
      expect(completed.value.status).toBe("ready");
      expect(completed.value.url).toContain("cdn.test");
      expect(completed.value.variants.length).toBeGreaterThan(0);
      const originalVariant = completed.value.variants.find((v) => v.variantType === "original");
      expect(originalVariant?.status).toBe("ready");
      const avatarVariant = completed.value.variants.find((v) => v.variantType === "avatar");
      // No real processing pipeline — non-original variants are skeleton.
      expect(avatarVariant?.status).toBe("processing_skeleton");
    }
  });

  it("a non-owner cannot complete someone else's intent", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const intent = await svc.createUploadIntent(profileIntent(goodAvatar));
    if (!intent.ok) throw new Error("intent failed");
    const res = await svc.completeUpload({
      actorUserId: "intruder",
      intentId: intent.value.intentId,
      assetId: intent.value.assetId,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("reused intent is rejected", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const intent = await svc.createUploadIntent(profileIntent(goodAvatar));
    if (!intent.ok) throw new Error("intent failed");
    const first = await svc.completeUpload({
      actorUserId: "user-1",
      intentId: intent.value.intentId,
      assetId: intent.value.assetId,
    });
    expect(first.ok).toBe(true);
    const replay = await svc.completeUpload({
      actorUserId: "user-1",
      intentId: intent.value.intentId,
      assetId: intent.value.assetId,
    });
    expect(replay.ok).toBe(false);
    if (!replay.ok) expect(replay.error.code).toBe("INTENT_ALREADY_USED");
  });

  it("env-required storage issues NO url and completeUpload fails STORAGE_UNAVAILABLE (no fake success)", async () => {
    const svc = createMediaService(deps(createEnvRequiredStoragePort()));
    const intent = await svc.createUploadIntent(bannerIntent(goodBanner));
    expect(intent.ok).toBe(true);
    if (!intent.ok) return;
    expect(intent.value.transport).toBe("ENV_REQUIRED");
    expect(intent.value.uploadUrl).toBeNull();

    const completed = await svc.completeUpload({
      actorUserId: "user-1",
      intentId: intent.value.intentId,
      assetId: intent.value.assetId,
    });
    expect(completed.ok).toBe(false);
    if (!completed.ok) expect(completed.error.code).toBe("STORAGE_UNAVAILABLE");
  });

  it("getPublicMediaUrl returns NOT_FOUND for an unknown ref", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const res = await svc.getPublicMediaUrl({ assetId: "nope" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("NOT_FOUND");
  });

  it("listAssetsForOwner returns all owner-owned assets", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    await svc.createUploadIntent(profileIntent(goodAvatar, "user-2"));
    const res = await svc.listAssetsForOwner({
      ownerType: "user_profile",
      ownerId: "user-2",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.length).toBe(1);
      expect(res.value[0].ownerType).toBe("user_profile");
    }
  });

  it("deleteMediaAssetSoft marks the asset deleted and hides it from list", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const intent = await svc.createUploadIntent(profileIntent(goodAvatar));
    if (!intent.ok) throw new Error("intent failed");
    const del = await svc.deleteMediaAssetSoft("user-1", intent.value.assetId);
    expect(del.ok).toBe(true);
    const list = await svc.listAssetsForOwner({
      ownerType: "user_profile",
      ownerId: "user-1",
    });
    expect(list.ok).toBe(true);
    if (list.ok) expect(list.value.length).toBe(0);
  });
});

describe("media service — verifyOwnedAssetForAttach", () => {
  async function readyAvatar(svc: ReturnType<typeof createMediaService>) {
    const intent = await svc.createUploadIntent(profileIntent(goodAvatar));
    if (!intent.ok) throw new Error("intent failed");
    const completed = await svc.completeUpload({
      actorUserId: "user-1",
      intentId: intent.value.intentId,
      assetId: intent.value.assetId,
    });
    if (!completed.ok) throw new Error("complete failed");
    return intent.value.assetId;
  }

  it("returns the public DTO when owner, purpose and ready status match", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const assetId = await readyAvatar(svc);
    const res = await svc.verifyOwnedAssetForAttach("user-1", assetId, "profile_avatar");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.assetId).toBe(assetId);
      expect(res.value.purpose).toBe("profile_avatar");
      expect(res.value.status).toBe("ready");
      expect(Object.keys(res.value)).not.toContain("ownerId");
      expect(Object.keys(res.value)).not.toContain("storageKey");
    }
  });

  it("rejects a foreign asset as FORBIDDEN", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const assetId = await readyAvatar(svc);
    const res = await svc.verifyOwnedAssetForAttach("intruder", assetId, "profile_avatar");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("rejects a mismatched purpose as INVALID_INPUT", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const assetId = await readyAvatar(svc);
    const res = await svc.verifyOwnedAssetForAttach("user-1", assetId, "profile_banner");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("INVALID_INPUT");
  });

  it("rejects a not-yet-completed asset as NOT_READY", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const intent = await svc.createUploadIntent(profileIntent(goodAvatar));
    if (!intent.ok) throw new Error("intent failed");
    const res = await svc.verifyOwnedAssetForAttach(
      "user-1",
      intent.value.assetId,
      "profile_avatar",
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("NOT_READY");
  });

  it("rejects an unknown assetId as NOT_FOUND", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const res = await svc.verifyOwnedAssetForAttach("user-1", "missing", "profile_avatar");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("NOT_FOUND");
  });
});
