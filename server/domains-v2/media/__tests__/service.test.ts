import { describe, it, expect } from "vitest";
import {
  createMediaService,
  createInMemoryMediaRepository,
  createEnvRequiredStoragePort,
  type MediaStoragePort,
  type UploadFileMeta,
} from "../public-api";

function deps(storage: MediaStoragePort) {
  let n = 0;
  return {
    repository: createInMemoryMediaRepository(),
    storage,
    clock: () => "2026-05-25T00:00:00.000Z",
    idGen: () => `asset-${++n}`,
  };
}

/** A connected storage port for tests that need a real destination/URL. */
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
        expiresAt: "2026-05-25T01:00:00.000Z",
      };
    },
  };
}

const goodAvatar: UploadFileMeta = { mimeType: "image/png", sizeBytes: 1024 };
const goodBanner: UploadFileMeta = { mimeType: "image/webp", sizeBytes: 2048 };

describe("media service — upload intents", () => {
  it("avatar upload intent requires an owner (userId)", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const res = await svc.createAvatarUploadIntent("", goodAvatar);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("banner upload intent requires an owner (userId)", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const res = await svc.createBannerUploadIntent("", goodBanner);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("creates an avatar intent for a valid image and owner", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const res = await svc.createAvatarUploadIntent("user-1", goodAvatar);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.purpose).toBe("avatar");
      expect(res.value.mimeType).toBe("image/png");
      expect(res.value.transport).toBe("READY");
      expect(res.value.uploadUrl).toContain("storage.test");
      expect(res.value.storageKey).toContain("user/user-1/avatar/");
    }
  });

  it("rejects an unsupported mime type", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const res = await svc.createAvatarUploadIntent("user-1", {
      mimeType: "image/svg+xml",
      sizeBytes: 1024,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("UNSUPPORTED_TYPE");
  });

  it("rejects a file larger than the avatar limit", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const res = await svc.createAvatarUploadIntent("user-1", {
      mimeType: "image/png",
      sizeBytes: 50 * 1024 * 1024,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("TOO_LARGE");
  });

  it("rejects an inline data: scheme source ref", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const inlineRef = "data:image/png;" + "x".repeat(8);
    const res = await svc.createAvatarUploadIntent("user-1", {
      mimeType: "image/png",
      sizeBytes: 1024,
      sourceUri: inlineRef,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("INVALID_INPUT");
  });
});

describe("media service — confirm + read", () => {
  it("with connected storage, confirm marks the asset ready and resolves a URL", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const intent = await svc.createAvatarUploadIntent("user-1", goodAvatar);
    expect(intent.ok).toBe(true);
    if (!intent.ok) return;

    const confirmed = await svc.confirmProfileMediaUpload("user-1", intent.value.assetId);
    expect(confirmed.ok).toBe(true);
    if (confirmed.ok) {
      expect(confirmed.value.status).toBe("ready");
      expect(confirmed.value.url).toContain("cdn.test");
    }
  });

  it("a non-owner cannot confirm someone else's asset", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const intent = await svc.createAvatarUploadIntent("user-1", goodAvatar);
    if (!intent.ok) throw new Error("intent failed");
    const res = await svc.confirmProfileMediaUpload("intruder", intent.value.assetId);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("env-required storage issues NO url and confirm fails STORAGE_UNAVAILABLE (no fake success)", async () => {
    const svc = createMediaService(deps(createEnvRequiredStoragePort()));
    const intent = await svc.createBannerUploadIntent("user-1", goodBanner);
    expect(intent.ok).toBe(true);
    if (!intent.ok) return;
    expect(intent.value.transport).toBe("ENV_REQUIRED");
    expect(intent.value.uploadUrl).toBeNull();

    const confirmed = await svc.confirmProfileMediaUpload("user-1", intent.value.assetId);
    expect(confirmed.ok).toBe(false);
    if (!confirmed.ok) expect(confirmed.error.code).toBe("STORAGE_UNAVAILABLE");
  });

  it("getPublicMediaUrl returns NOT_FOUND for an unknown ref", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const res = await svc.getPublicMediaUrl({ assetId: "nope" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("NOT_FOUND");
  });
});

describe("media service — verifyProfileAssetForAttach", () => {
  async function readyAvatar(svc: ReturnType<typeof createMediaService>) {
    const intent = await svc.createAvatarUploadIntent("user-1", goodAvatar);
    if (!intent.ok) throw new Error("intent failed");
    const confirmed = await svc.confirmProfileMediaUpload("user-1", intent.value.assetId);
    if (!confirmed.ok) throw new Error("confirm failed");
    return intent.value.assetId;
  }

  it("returns the public DTO when owner, purpose and ready status match", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const assetId = await readyAvatar(svc);
    const res = await svc.verifyProfileAssetForAttach("user-1", assetId, "avatar");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.assetId).toBe(assetId);
      expect(res.value.purpose).toBe("avatar");
      expect(res.value.status).toBe("ready");
      // Public DTO never leaks ownerId/storageKey
      expect(Object.keys(res.value)).not.toContain("ownerId");
      expect(Object.keys(res.value)).not.toContain("storageKey");
    }
  });

  it("rejects a foreign asset as FORBIDDEN", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const assetId = await readyAvatar(svc);
    const res = await svc.verifyProfileAssetForAttach("intruder", assetId, "avatar");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("rejects a mismatched purpose (avatar asset used as banner ref) as INVALID_INPUT", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const assetId = await readyAvatar(svc);
    const res = await svc.verifyProfileAssetForAttach("user-1", assetId, "banner");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("INVALID_INPUT");
  });

  it("rejects a pending (not-yet-uploaded) asset as NOT_READY", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const intent = await svc.createAvatarUploadIntent("user-1", goodAvatar);
    if (!intent.ok) throw new Error("intent failed");
    const res = await svc.verifyProfileAssetForAttach(
      "user-1",
      intent.value.assetId,
      "avatar",
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("NOT_READY");
  });

  it("rejects an unknown assetId as NOT_FOUND", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const res = await svc.verifyProfileAssetForAttach("user-1", "missing", "avatar");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("NOT_FOUND");
  });

  it("rejects an empty userId as FORBIDDEN", async () => {
    const svc = createMediaService(deps(connectedStorage()));
    const res = await svc.verifyProfileAssetForAttach("", "some-id", "avatar");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });
});
