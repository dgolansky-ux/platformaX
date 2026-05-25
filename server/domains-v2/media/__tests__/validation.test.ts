import { describe, it, expect } from "vitest";
import { MEDIA_VALIDATION_LIMITS, maxBytesFor } from "../public-api";
import { validateUploadFileMeta } from "../internal/validation";

describe("media validation", () => {
  it("accepts jpeg/png/webp within size", () => {
    for (const mimeType of MEDIA_VALIDATION_LIMITS.allowedMimeTypes) {
      const errors = validateUploadFileMeta("avatar", { mimeType, sizeBytes: 1024 });
      expect(Object.keys(errors)).toHaveLength(0);
    }
  });

  it("rejects svg and unknown mime types", () => {
    expect(validateUploadFileMeta("avatar", { mimeType: "image/svg+xml", sizeBytes: 10 }).mimeType)
      .toBeDefined();
    expect(validateUploadFileMeta("avatar", { mimeType: "application/pdf", sizeBytes: 10 }).mimeType)
      .toBeDefined();
    expect(validateUploadFileMeta("avatar", { mimeType: "", sizeBytes: 10 }).mimeType)
      .toBeDefined();
  });

  it("enforces per-purpose size limits (banner allows more than avatar)", () => {
    expect(maxBytesFor("banner")).toBeGreaterThan(maxBytesFor("avatar"));
    const overAvatar = maxBytesFor("avatar") + 1;
    expect(validateUploadFileMeta("avatar", { mimeType: "image/png", sizeBytes: overAvatar }).sizeBytes)
      .toBeDefined();
    // the same size is still fine for a banner
    expect(
      Object.keys(validateUploadFileMeta("banner", { mimeType: "image/png", sizeBytes: overAvatar })),
    ).toHaveLength(0);
  });

  it("rejects a non-positive size", () => {
    expect(validateUploadFileMeta("avatar", { mimeType: "image/png", sizeBytes: 0 }).sizeBytes)
      .toBeDefined();
  });

  it("rejects an inline data: scheme source ref", () => {
    const inline = "data:image/png;" + "AAAA";
    const errors = validateUploadFileMeta("avatar", {
      mimeType: "image/png",
      sizeBytes: 1024,
      sourceUri: inline,
    });
    expect(errors.sourceUri).toBeDefined();
  });
});
