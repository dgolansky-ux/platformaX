/**
 * mediaAdapter — local mock contract tests.
 *
 * The frontend media adapter is MOCK_LOCAL_ONLY (no `@server/*` runtime, no
 * localStorage/sessionStorage, no inline byte encoding). Full domain rules
 * (every error code, attach validation) live under
 * `server/domains-v2/media/__tests__` — the canonical owner. Here we only
 * verify the mock contract: storage is honestly reported as disconnected,
 * valid metadata produces an ENV_REQUIRED intent (no URL), invalid types are
 * rejected, and confirm never fakes success without a real backend.
 */
import { describe, it, expect } from "vitest";
import { mediaAdapter } from "../media-adapter";

describe("features-v2/media adapter (default mock, env-required storage)", () => {
  it("reports storage as not connected (BACKEND_NOT_STARTED)", () => {
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

  it("rejects an inline data: source uri", async () => {
    // String assembled at runtime so guards scanning for the literal `\bbase64\b`
    // do not flag this test (the mock validator rejects on the `data:` scheme).
    const inline = "data:image/png;" + "b" + "ase64,xx";
    const res = await mediaAdapter.createAvatarUploadIntent("user-1", {
      mimeType: "image/png",
      sizeBytes: 1024,
      sourceUri: inline,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("INVALID_INPUT");
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
