import { describe, it, expect } from "vitest";
import type { MediaServicePort } from "@shared/contracts/media-view";
import {
  createMediaAdapter,
  createNotConnectedMediaPort,
  mediaAdapter,
} from "../media-adapter";

/**
 * The client media adapter is a transport-neutral wrapper. The real media
 * validation + intent runtime is tested server-side in
 * `server/domains-v2/media/__tests__/service.test.ts`. Here we verify the client
 * boundary: it forwards to a port, reports connection honestly, and the default
 * adapter is an explicit not-connected stub (no server runtime bundled).
 */

function recordingPort(): { port: MediaServicePort; calls: string[] } {
  const calls: string[] = [];
  const okIntent = (purpose: "avatar" | "banner" | "statusPhoto") =>
    Promise.resolve({
      ok: true as const,
      value: {
        assetId: "asset-1",
        purpose,
        uploadUrl: null,
        method: "PUT" as const,
        storageKey: "k",
        maxBytes: 1024,
        mimeType: "image/png",
        transport: "ENV_REQUIRED" as const,
        expiresAt: null,
      },
    });
  const port: MediaServicePort = {
    createAvatarUploadIntent: () => {
      calls.push("avatar");
      return okIntent("avatar");
    },
    createBannerUploadIntent: () => okIntent("banner"),
    createStatusPhotoUploadIntent: () => okIntent("statusPhoto"),
    confirmProfileMediaUpload: async () => ({
      ok: false,
      error: { code: "NOT_READY", message: "n/a" },
    }),
    getPublicMediaUrl: async () => ({
      ok: false,
      error: { code: "NOT_FOUND", message: "n/a" },
    }),
  };
  return { port, calls };
}

describe("createMediaAdapter (client boundary)", () => {
  it("reports the injected storageConnected flag", () => {
    const { port } = recordingPort();
    expect(createMediaAdapter({ port, storageConnected: true }).isStorageConnected()).toBe(true);
    expect(createMediaAdapter({ port, storageConnected: false }).isStorageConnected()).toBe(false);
  });

  it("forwards calls to the underlying port", async () => {
    const { port, calls } = recordingPort();
    const adapter = createMediaAdapter({ port, storageConnected: false });
    const res = await adapter.createAvatarUploadIntent("u-1", {
      mimeType: "image/png",
      sizeBytes: 1024,
    });
    expect(res.ok).toBe(true);
    expect(calls).toContain("avatar");
  });
});

describe("default mediaAdapter (transport not connected)", () => {
  it("reports storage as not connected", () => {
    expect(mediaAdapter.isStorageConnected()).toBe(false);
  });

  it("upload intent returns STORAGE_UNAVAILABLE — never fakes success", async () => {
    const res = await mediaAdapter.createAvatarUploadIntent("user-1", {
      mimeType: "image/png",
      sizeBytes: 1024,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("STORAGE_UNAVAILABLE");
  });

  it("confirm returns STORAGE_UNAVAILABLE", async () => {
    const res = await mediaAdapter.confirmProfileMediaUpload("user-1", "asset-1");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("STORAGE_UNAVAILABLE");
  });

  it("standalone not-connected port reports STORAGE_UNAVAILABLE for every method", async () => {
    const port = createNotConnectedMediaPort();
    const results = await Promise.all([
      port.createBannerUploadIntent("u", { mimeType: "image/png", sizeBytes: 1 }),
      port.getPublicMediaUrl({ assetId: "a" }),
    ]);
    for (const r of results) {
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("STORAGE_UNAVAILABLE");
    }
  });
});
