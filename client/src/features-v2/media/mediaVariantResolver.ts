/**
 * features-v2/media — variant resolver for the display kit.
 *
 * Picks the best available variant for a given surface need:
 *  - avatar slot → `avatar` then `small` then `original`,
 *  - banner slot → `banner` then `large` then `original`,
 *  - feed card → `thumbnail` then `medium` then `original`,
 *  - full post → `large` then `original`,
 *  - teaser → `preview` then `thumbnail` then `original`.
 *
 * Falls through gracefully — if the requested variant is missing or its
 * status is not `ready`, returns the next-best URL the surface can serve.
 * Never invents a URL.
 */
import type {
  MediaAssetDTO,
  MediaVariantType,
} from "@shared/contracts/media";

export type DisplayVariantNeed =
  | "avatar"
  | "banner"
  | "feed_card"
  | "full"
  | "teaser"
  | "gallery_tile";

const ORDER: Record<DisplayVariantNeed, readonly MediaVariantType[]> = {
  avatar: ["avatar", "small", "medium", "original"],
  banner: ["banner", "large", "medium", "original"],
  feed_card: ["thumbnail", "medium", "large", "original"],
  full: ["large", "medium", "original"],
  teaser: ["preview", "thumbnail", "medium", "original"],
  gallery_tile: ["thumbnail", "small", "medium", "original"],
};

export function resolveDisplayUrl(
  asset: MediaAssetDTO | null | undefined,
  need: DisplayVariantNeed,
): string | null {
  if (!asset) return null;
  const order = ORDER[need];
  for (const variantType of order) {
    const variant = asset.variants.find((v) => v.variantType === variantType);
    if (variant && variant.status === "ready" && variant.url) return variant.url;
  }
  return asset.status === "ready" ? asset.url : null;
}
