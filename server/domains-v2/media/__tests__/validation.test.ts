import { describe, it, expect } from "vitest";
import { MEDIA_VALIDATION_LIMITS, maxBytesFor } from "../public-api";
import {
  validateOwnerType,
  validatePurpose,
  validateUploadFileMeta,
} from "../internal/validation";

describe("media validation — purpose + owner", () => {
  it("rejects unknown purposes", () => {
    const err = validatePurpose("not-a-purpose");
    expect(err.purpose).toBeDefined();
  });

  it("accepts every registered purpose", () => {
    expect(Object.keys(validatePurpose("profile_avatar")).length).toBe(0);
    expect(Object.keys(validatePurpose("community_banner")).length).toBe(0);
    expect(Object.keys(validatePurpose("channel_post_media")).length).toBe(0);
  });

  it("rejects owner type that does not match the purpose", () => {
    const err = validateOwnerType("profile_avatar", "community");
    expect(err.ownerType).toBeDefined();
  });

  it("accepts the canonical owner type for each surface", () => {
    expect(Object.keys(validateOwnerType("profile_avatar", "user_profile")).length).toBe(0);
    expect(Object.keys(validateOwnerType("community_banner", "community")).length).toBe(0);
    expect(Object.keys(validateOwnerType("channel_post_media", "post")).length).toBe(0);
  });
});

describe("media validation — file meta", () => {
  it("accepts jpeg/png/webp within size", () => {
    for (const mimeType of MEDIA_VALIDATION_LIMITS.allowedMimeTypes) {
      const errors = validateUploadFileMeta("profile_avatar", { mimeType, sizeBytes: 1024 });
      expect(Object.keys(errors)).toHaveLength(0);
    }
  });

  it("rejects svg, html, executable and unknown mime types", () => {
    expect(
      validateUploadFileMeta("profile_avatar", {
        mimeType: "image/svg+xml",
        sizeBytes: 10,
      }).mimeType,
    ).toBeDefined();
    expect(
      validateUploadFileMeta("profile_avatar", {
        mimeType: "text/html",
        sizeBytes: 10,
      }).mimeType,
    ).toBeDefined();
    expect(
      validateUploadFileMeta("profile_avatar", {
        mimeType: "application/x-msdownload",
        sizeBytes: 10,
      }).mimeType,
    ).toBeDefined();
    expect(
      validateUploadFileMeta("profile_avatar", {
        mimeType: "application/pdf",
        sizeBytes: 10,
      }).mimeType,
    ).toBeDefined();
    expect(
      validateUploadFileMeta("profile_avatar", { mimeType: "", sizeBytes: 10 }).mimeType,
    ).toBeDefined();
  });

  it("rejects video uploads (VIDEO_PROCESSING_NOT_STARTED)", () => {
    const err = validateUploadFileMeta("friend_feed_post_media", {
      mimeType: "video/mp4",
      sizeBytes: 1024,
    });
    expect(err.mimeType).toBeDefined();
  });

  it("enforces per-purpose size limits (banner allows more than avatar)", () => {
    expect(maxBytesFor("profile_banner")).toBeGreaterThan(maxBytesFor("profile_avatar"));
    const overAvatar = maxBytesFor("profile_avatar") + 1;
    expect(
      validateUploadFileMeta("profile_avatar", {
        mimeType: "image/png",
        sizeBytes: overAvatar,
      }).sizeBytes,
    ).toBeDefined();
    expect(
      Object.keys(
        validateUploadFileMeta("profile_banner", {
          mimeType: "image/png",
          sizeBytes: overAvatar,
        }),
      ),
    ).toHaveLength(0);
  });

  it("rejects a non-positive size", () => {
    expect(
      validateUploadFileMeta("profile_avatar", { mimeType: "image/png", sizeBytes: 0 }).sizeBytes,
    ).toBeDefined();
  });

  it("rejects an inline data: scheme source ref", () => {
    const inline = "data:image/png;" + "AAAA";
    const errors = validateUploadFileMeta("profile_avatar", {
      mimeType: "image/png",
      sizeBytes: 1024,
      sourceUri: inline,
    });
    expect(errors.sourceUri).toBeDefined();
  });
});
