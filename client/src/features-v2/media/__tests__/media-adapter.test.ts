import { describe, it, expect } from "vitest";
import { mediaAdapter } from "../media-adapter";

describe("features-v2/media adapter (default, env-required storage)", () => {
  it("reports storage as not connected", () => {
    expect(mediaAdapter.isStorageConnected()).toBe(false);
  });

  it("validates a good avatar and returns an ENV_REQUIRED intent (no upload url)", async () => {
    const res = await mediaAdapter.createAvatarUploadIntent("user-1", {
      mimeType: "image/png",
      sizeBytes: 1024,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.transport).toBe("ENV_REQUIRED");
      expect(res.value.uploadUrl).toBeNull();
      expect(res.value.purpose).toBe("avatar");
    }
  });

  it("rejects an unsupported type through the boundary", async () => {
    const res = await mediaAdapter.createBannerUploadIntent("user-1", {
      mimeType: "image/svg+xml",
      sizeBytes: 1024,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("UNSUPPORTED_TYPE");
  });

  it("confirm fails STORAGE_UNAVAILABLE — never fakes success without storage", async () => {
    const intent = await mediaAdapter.createAvatarUploadIntent("user-1", {
      mimeType: "image/webp",
      sizeBytes: 2048,
    });
    if (!intent.ok) throw new Error("intent should succeed");
    const res = await mediaAdapter.confirmProfileMediaUpload("user-1", intent.value.assetId);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("STORAGE_UNAVAILABLE");
  });
});
