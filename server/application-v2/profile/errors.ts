/**
 * application-v2/profile — application-level error contract
 *
 * The profile application boundary translates identity / media domain errors
 * into a single, frontend-safe code-set. Domain raw error messages are NEVER
 * forwarded as-is to the UI; only the safe message embedded here is.
 *
 * Codes are intentionally small and stable so a future HTTP transport can map
 * them 1:1 to status codes without leaking domain internals.
 */

export type ProfileApplicationErrorCode =
  | "PROFILE_NOT_FOUND"
  | "PROFILE_FORBIDDEN"
  | "PROFILE_VALIDATION_FAILED"
  | "ONBOARDING_ALREADY_COMPLETED"
  | "MEDIA_ASSET_NOT_FOUND"
  | "MEDIA_ASSET_FORBIDDEN"
  | "MEDIA_ASSET_TYPE_MISMATCH"
  | "MEDIA_ASSET_NOT_READY"
  | "UNAUTHENTICATED";

export type ProfileApplicationError = {
  code: ProfileApplicationErrorCode;
  /** Safe, user-facing Polish message. Never includes raw domain detail. */
  message: string;
  /** Optional field-level validation map, safe for UI display. */
  fields?: Record<string, string>;
};

export type ProfileApplicationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ProfileApplicationError };

export function makeProfileError(
  code: ProfileApplicationErrorCode,
  message: string,
  fields?: Record<string, string>,
): ProfileApplicationError {
  return fields ? { code, message, fields } : { code, message };
}
