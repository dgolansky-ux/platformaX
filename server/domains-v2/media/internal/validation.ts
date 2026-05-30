/**
 * media — upload validation (internal)
 *
 * Server-side validation of upload metadata (purpose + owner type + file meta)
 * against the purpose registry. Raw bytes never reach this layer; we validate
 * declared mime, declared size and reject inline `data:` scheme refs (uploads
 * must go through a storage target).
 *
 * Video MIME types are advertised by some purpose definitions for future
 * support, but the live validator currently rejects `video/*` uploads with
 * `UNSUPPORTED_TYPE` — there is no processing pipeline yet
 * (VIDEO_PROCESSING_NOT_STARTED).
 */
import type {
  MediaOwnerType,
  MediaPurpose,
  UploadFileMeta,
} from "@shared/contracts/media";
import { getPurposeDefinition, isMediaPurpose } from "../purpose-registry";

export type FieldErrors = Record<string, string>;

/** Public-safe list of universally allowed image types. */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const MB = 1024 * 1024;

/**
 * Stable convenience constants — frontend pickers and tests rely on these for
 * "this is the cap if you don't know the purpose" fallbacks. Authoritative
 * limits are always the per-purpose values in `purpose-registry`.
 */
export const MEDIA_VALIDATION_LIMITS = {
  avatarMaxBytes: 5 * MB,
  bannerMaxBytes: 10 * MB,
  bioMediaMaxBytes: 5 * MB,
  postMediaMaxBytes: 10 * MB,
  allowedMimeTypes: ALLOWED_MIME_TYPES,
} as const;

export function maxBytesFor(purpose: MediaPurpose): number {
  return getPurposeDefinition(purpose).maxSizeBytes;
}

export function maxFilesFor(purpose: MediaPurpose): number {
  return getPurposeDefinition(purpose).maxFiles;
}

export function allowedMimeFor(purpose: MediaPurpose): readonly string[] {
  return getPurposeDefinition(purpose).allowedMimeTypes;
}

function isInlineRef(uri: string | null | undefined): boolean {
  if (!uri) return false;
  return /^\s*data:/i.test(uri);
}

function isVideoMime(mime: string): boolean {
  return mime.startsWith("video/");
}

export function validatePurpose(value: string): FieldErrors {
  if (!isMediaPurpose(value)) {
    return { purpose: "Nieznany typ medium" };
  }
  return {};
}

export function validateOwnerType(
  purpose: MediaPurpose,
  ownerType: MediaOwnerType,
): FieldErrors {
  const def = getPurposeDefinition(purpose);
  if (!def.allowedOwnerTypes.includes(ownerType)) {
    return { ownerType: "Ten typ właściciela nie pasuje do tego medium" };
  }
  return {};
}

export function validateUploadFileMeta(
  purpose: MediaPurpose,
  meta: UploadFileMeta,
): FieldErrors {
  const errors: FieldErrors = {};
  const allowedMime = allowedMimeFor(purpose);

  if (!meta || typeof meta.mimeType !== "string" || meta.mimeType.length === 0) {
    errors.mimeType = "Brak typu pliku";
  } else if (!allowedMime.includes(meta.mimeType)) {
    errors.mimeType = "Niedozwolony typ pliku dla tego medium";
  } else if (isVideoMime(meta.mimeType)) {
    // Video processing is not wired yet (VIDEO_PROCESSING_NOT_STARTED) —
    // reject up front rather than accept bytes we cannot serve back.
    errors.mimeType = "Video tymczasowo wyłączone — wgraj obraz";
  }

  const size = Number(meta?.sizeBytes);
  const maxBytes = maxBytesFor(purpose);
  if (!Number.isFinite(size) || size <= 0) {
    errors.sizeBytes = "Niepoprawny rozmiar pliku";
  } else if (size > maxBytes) {
    const limitMb = Math.round(maxBytes / MB);
    errors.sizeBytes = `Plik jest za duży (maks. ${limitMb} MB)`;
  }

  if (isInlineRef(meta?.sourceUri)) {
    errors.sourceUri = "Nieobsługiwane źródło pliku";
  }

  return errors;
}
