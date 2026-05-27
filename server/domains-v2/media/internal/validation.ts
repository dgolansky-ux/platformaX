/**
 * media — upload validation (internal)
 *
 * Server-side validation of file metadata for avatar/banner uploads. Mirrors
 * what the UI blocks, plus rules the UI cannot be trusted to enforce. Raw bytes
 * never reach this layer; we validate declared type, declared size and reject
 * inline `data:` scheme refs (uploads must go through a storage target).
 */
import type { MediaPurpose } from "../dto";
import type { UploadFileMeta } from "../contracts";

export type FieldErrors = Record<string, string>;

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

function isAllowedMime(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** Inline scheme refs (`data:`) are never accepted — bytes go to storage. */
function isInlineRef(uri: string | null | undefined): boolean {
  if (!uri) return false;
  return /^\s*data:/i.test(uri);
}

export function validateUploadFileMeta(
  purpose: MediaPurpose,
  meta: UploadFileMeta,
): FieldErrors {
  const errors: FieldErrors = {};

  if (!meta || typeof meta.mimeType !== "string" || meta.mimeType.length === 0) {
    errors.mimeType = "Brak typu pliku";
  } else if (!isAllowedMime(meta.mimeType)) {
    errors.mimeType = "Dozwolone formaty: JPG, PNG, WEBP";
  }

  const size = Number(meta?.sizeBytes);
  if (!Number.isFinite(size) || size <= 0) {
    errors.sizeBytes = "Niepoprawny rozmiar pliku";
  } else if (size > maxBytesFor(purpose)) {
    const limitMb = Math.round(maxBytesFor(purpose) / MB);
    errors.sizeBytes = `Plik jest za duży (maks. ${limitMb} MB)`;
  }

  if (isInlineRef(meta?.sourceUri)) {
    errors.sourceUri = "Nieobsługiwane źródło pliku";
  }

  return errors;
}
