/**
 * media — purpose registry tests.
 *
 * Verifies the registry stays internally consistent: every purpose has at
 * least one allowed owner type / mime / variant policy entry, allowed owner
 * types do not contradict the user-facing purpose family, and the shared
 * client-side mirror matches the server-side lookup exactly.
 */
import { describe, it, expect } from "vitest";
import {
  getPurposeDefinition,
  isMediaPurpose,
  listPurposeDefinitions,
  buildStoragePath,
} from "../public-api";
import {
  MEDIA_PURPOSE_LIST,
  getMediaPurposeDefinition,
} from "@shared/contracts/media-purpose-registry";

describe("media purpose registry", () => {
  it("covers every shared MediaPurpose value", () => {
    for (const purpose of MEDIA_PURPOSE_LIST) {
      expect(isMediaPurpose(purpose)).toBe(true);
      const def = getPurposeDefinition(purpose);
      expect(def.allowedOwnerTypes.length).toBeGreaterThan(0);
      expect(def.allowedMimeTypes.length).toBeGreaterThan(0);
      expect(def.maxSizeBytes).toBeGreaterThan(0);
      expect(def.maxFiles).toBeGreaterThan(0);
      expect(def.variantPolicy.length).toBeGreaterThan(0);
    }
  });

  it("server purpose definitions match the shared client mirror", () => {
    for (const purpose of MEDIA_PURPOSE_LIST) {
      expect(getPurposeDefinition(purpose)).toEqual(getMediaPurposeDefinition(purpose));
    }
  });

  it("isMediaPurpose rejects unknown values", () => {
    expect(isMediaPurpose("definitely_not_a_purpose")).toBe(false);
    expect(isMediaPurpose("")).toBe(false);
  });

  it("listPurposeDefinitions returns all purposes", () => {
    expect(listPurposeDefinitions().length).toBe(MEDIA_PURPOSE_LIST.length);
  });

  it("buildStoragePath uses owner_type/owner_id/purpose/asset_id form", () => {
    const path = buildStoragePath("user_profile", "u1", "profile_avatar", "a1");
    expect(path).toBe("user_profile/u1/profile_avatar/a1");
    expect(path.includes("\\")).toBe(false);
  });

  it("avatar/banner purposes only accept image mime types", () => {
    const avatar = getPurposeDefinition("profile_avatar");
    expect(avatar.allowedMimeTypes.every((m) => m.startsWith("image/"))).toBe(true);
    const banner = getPurposeDefinition("community_banner");
    expect(banner.allowedMimeTypes.every((m) => m.startsWith("image/"))).toBe(true);
  });

  it("workplace teaser caps max files at 3", () => {
    const def = getPurposeDefinition("workplace_teaser_media");
    expect(def.maxFiles).toBe(3);
  });

  it("event gallery accepts up to 20 files", () => {
    const def = getPurposeDefinition("event_gallery");
    expect(def.maxFiles).toBe(20);
  });

  it("post media has post owner type", () => {
    const def = getPurposeDefinition("friend_feed_post_media");
    expect(def.allowedOwnerTypes).toContain("post");
  });
});
