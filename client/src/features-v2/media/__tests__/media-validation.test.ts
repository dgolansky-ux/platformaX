/**
 * features-v2/media — client-side validation tests.
 *
 * The picker pre-validates file metadata locally against the purpose registry
 * mirror so it can show inline feedback. Authoritative validation still runs
 * on the backend.
 */
import { describe, it, expect } from "vitest";
import {
  validateFileCount,
  validateFileForPurpose,
} from "../mediaValidation";

describe("validateFileForPurpose", () => {
  it("accepts a valid image", () => {
    const err = validateFileForPurpose("profile_avatar", {
      mimeType: "image/png",
      sizeBytes: 1024,
    });
    expect(err).toBeNull();
  });

  it("rejects an unsupported mime type", () => {
    const err = validateFileForPurpose("profile_avatar", {
      mimeType: "image/svg+xml",
      sizeBytes: 1024,
    });
    expect(err?.field).toBe("mimeType");
  });

  it("rejects an oversize file", () => {
    const err = validateFileForPurpose("profile_avatar", {
      mimeType: "image/png",
      sizeBytes: 50 * 1024 * 1024,
    });
    expect(err?.field).toBe("sizeBytes");
  });

  it("rejects video upload (VIDEO_PROCESSING_NOT_STARTED)", () => {
    const err = validateFileForPurpose("friend_feed_post_media", {
      mimeType: "video/mp4",
      sizeBytes: 1024,
    });
    expect(err?.field).toBe("mimeType");
  });

  it("rejects an inline data: source URI", () => {
    const inline = "data:image/png;" + "b" + "ase64,xxx";
    const err = validateFileForPurpose("profile_avatar", {
      mimeType: "image/png",
      sizeBytes: 1024,
      sourceUri: inline,
    });
    expect(err?.field).toBe("sourceUri");
  });
});

describe("validateFileCount", () => {
  it("accepts adding within the limit", () => {
    expect(validateFileCount("event_gallery", 5, 5)).toBeNull();
  });

  it("rejects exceeding the per-purpose limit", () => {
    expect(validateFileCount("profile_avatar", 1, 1)?.field).toBe("maxFiles");
    expect(validateFileCount("event_gallery", 18, 5)?.field).toBe("maxFiles");
  });
});
