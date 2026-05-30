/**
 * application-v2/use-cases/media — application-level errors.
 *
 * Translates raw `media` domain errors plus permission gating into a small,
 * frontend-safe code set. Surface-level callers (frontend + future HTTP
 * controllers) only ever see these codes.
 */
import type { MediaError } from "@server/domains-v2/media/public-api";

export type MediaApplicationErrorCode =
  | "UNAUTHENTICATED"
  | "PERMISSION_DENIED"
  | "INVALID_INPUT"
  | "INVALID_PURPOSE"
  | "INVALID_OWNER"
  | "UNSUPPORTED_TYPE"
  | "TOO_LARGE"
  | "TOO_MANY_FILES"
  | "NOT_FOUND"
  | "NOT_READY"
  | "STORAGE_UNAVAILABLE"
  | "INTENT_EXPIRED"
  | "INTENT_ALREADY_USED";

export type MediaApplicationError = {
  code: MediaApplicationErrorCode;
  message: string;
  fields?: Record<string, string>;
};

export type MediaApplicationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: MediaApplicationError };

export function makeMediaAppError(
  code: MediaApplicationErrorCode,
  message: string,
  fields?: Record<string, string>,
): MediaApplicationError {
  return fields ? { code, message, fields } : { code, message };
}

export function mapMediaDomainError(err: MediaError): MediaApplicationError {
  switch (err.code) {
    case "FORBIDDEN":
      return makeMediaAppError("PERMISSION_DENIED", err.message);
    case "INVALID_PURPOSE":
      return makeMediaAppError("INVALID_PURPOSE", err.message, err.fields);
    case "INVALID_OWNER_TYPE":
      return makeMediaAppError("INVALID_OWNER", err.message, err.fields);
    case "INVALID_INPUT":
      return makeMediaAppError("INVALID_INPUT", err.message, err.fields);
    case "UNSUPPORTED_TYPE":
      return makeMediaAppError("UNSUPPORTED_TYPE", err.message, err.fields);
    case "TOO_LARGE":
      return makeMediaAppError("TOO_LARGE", err.message, err.fields);
    case "TOO_MANY_FILES":
      return makeMediaAppError("TOO_MANY_FILES", err.message, err.fields);
    case "NOT_FOUND":
      return makeMediaAppError("NOT_FOUND", err.message);
    case "NOT_READY":
      return makeMediaAppError("NOT_READY", err.message);
    case "STORAGE_UNAVAILABLE":
      return makeMediaAppError("STORAGE_UNAVAILABLE", err.message);
    case "INTENT_EXPIRED":
      return makeMediaAppError("INTENT_EXPIRED", err.message);
    case "INTENT_ALREADY_USED":
      return makeMediaAppError("INTENT_ALREADY_USED", err.message);
  }
}
