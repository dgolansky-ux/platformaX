/**
 * features-v2/media — mediaVariantResolver tests.
 *
 * The resolver picks the best available variant URL for each display surface
 * (avatar / banner / feed card / teaser / full / gallery tile). It must:
 *   * never invent a URL,
 *   * fall back gracefully to the next-best variant,
 *   * fall back to the original/asset url last,
 *   * return null when no usable variant exists.
 */
import { describe, it, expect } from "vitest";
import { resolveDisplayUrl } from "../mediaVariantResolver";
import type { MediaAssetDTO, MediaVariantDTO } from "@shared/contracts/media";

function variant(
  variantType: MediaVariantDTO["variantType"],
  url: string | null,
  status: MediaVariantDTO["status"] = "ready",
): MediaVariantDTO {
  return { variantType, url, status, width: null, height: null };
}

function asset(variants: readonly MediaVariantDTO[], url: string | null = null): MediaAssetDTO {
  return {
    assetId: "a-1",
    purpose: "friend_feed_post_media",
    ownerType: "post",
    status: "ready",
    visibility: "public",
    url,
    mimeType: "image/png",
    width: null,
    height: null,
    durationSeconds: null,
    variants,
  };
}

describe("resolveDisplayUrl", () => {
  it("returns null when asset is null/undefined", () => {
    expect(resolveDisplayUrl(null, "avatar")).toBeNull();
    expect(resolveDisplayUrl(undefined, "avatar")).toBeNull();
  });

  it("avatar slot prefers the avatar variant", () => {
    const url = resolveDisplayUrl(
      asset([
        variant("original", "https://cdn/original"),
        variant("avatar", "https://cdn/avatar"),
        variant("small", "https://cdn/small"),
      ]),
      "avatar",
    );
    expect(url).toBe("https://cdn/avatar");
  });

  it("falls back to the next-best variant if the preferred one is processing", () => {
    const url = resolveDisplayUrl(
      asset([
        variant("avatar", null, "processing_skeleton"),
        variant("small", "https://cdn/small"),
        variant("original", "https://cdn/original"),
      ]),
      "avatar",
    );
    expect(url).toBe("https://cdn/small");
  });

  it("banner slot prefers the banner variant, then large", () => {
    const url = resolveDisplayUrl(
      asset([
        variant("banner", "https://cdn/banner"),
        variant("large", "https://cdn/large"),
      ]),
      "banner",
    );
    expect(url).toBe("https://cdn/banner");
  });

  it("feed card prefers thumbnail then medium", () => {
    const url = resolveDisplayUrl(
      asset([
        variant("thumbnail", "https://cdn/thumb"),
        variant("large", "https://cdn/large"),
      ]),
      "feed_card",
    );
    expect(url).toBe("https://cdn/thumb");
  });

  it("teaser prefers preview", () => {
    const url = resolveDisplayUrl(
      asset([
        variant("preview", "https://cdn/preview"),
        variant("thumbnail", "https://cdn/thumb"),
      ]),
      "teaser",
    );
    expect(url).toBe("https://cdn/preview");
  });

  it("falls back to the asset url when no variant is ready", () => {
    const url = resolveDisplayUrl(
      asset([variant("thumbnail", null, "processing_skeleton")], "https://cdn/original"),
      "feed_card",
    );
    expect(url).toBe("https://cdn/original");
  });

  it("returns null when nothing is ready", () => {
    const url = resolveDisplayUrl(
      asset([variant("thumbnail", null, "processing_skeleton")]),
      "feed_card",
    );
    expect(url).toBeNull();
  });
});
