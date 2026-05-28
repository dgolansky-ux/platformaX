/**
 * media — upload validation (internal)
 *
 * Server-side validation of file metadata for avatar/banner uploads. Mirrors
 * what the UI blocks, plus rules the UI cannot be trusted to enforce. Raw bytes
 * never reach this layer; we validate declared type, declared size and reject
 * inline `data:` scheme refs (uploads must go through a storage target).
 *
 * Stable limits (ALLOWED_MIME_TYPES, MEDIA_VALIDATION_LIMITS, maxBytesFor)
 * live in `../validation-limits.ts` and are re-exported here for internal
 * consumers. The public-api re-exports them from the stable file, not from here.
 */
import type { MediaPurpose } from "../dto";
import type { UploadFileMeta } from "../contracts";
import {
  ALLOWED_MIME_TYPES,
  MEDIA_VALIDATION_LIMITS,
  maxBytesFor,
} from "../validation-limits";

export { ALLOWED_MIME_TYPES, MEDIA_VALIDATION_LIMITS, maxBytesFor };

export type FieldErrors = Record<string, string>;

const MB = 1024 * 1024;

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
