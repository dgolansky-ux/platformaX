/**
 * media — validation limits (public, stable contract)
 *
 * Exposed by `public-api.ts` as a stable, owner-reviewable contract for clients
 * (forms, adapters, tests) that need to mirror server-side limits.
 *
 * Private impl details (validateUploadFileMeta) stay in `internal/validation.ts`
 * and are not part of the public surface.
 */
import type { MediaPurpose } from "./dto";

/** Only raster image types accepted. SVG is rejected (script-in-image risk). */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const MB = 1024 * 1024;

export const MEDIA_VALIDATION_LIMITS = {
  avatarMaxBytes: 5 * MB,
  bannerMaxBytes: 10 * MB,
  statusPhotoMaxBytes: 5 * MB,
  allowedMimeTypes: ALLOWED_MIME_TYPES,
} as const;

export function maxBytesFor(purpose: MediaPurpose): number {
  switch (purpose) {
    case "avatar":
      return MEDIA_VALIDATION_LIMITS.avatarMaxBytes;
    case "banner":
      return MEDIA_VALIDATION_LIMITS.bannerMaxBytes;
    case "statusPhoto":
      return MEDIA_VALIDATION_LIMITS.statusPhotoMaxBytes;
  }
}
