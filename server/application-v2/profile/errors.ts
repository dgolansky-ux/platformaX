/**
 * application-v2/profile — application-level error contract
 *
 * The canonical error types live in `@shared/contracts/profile-view` so the
 * frontend can consume them without importing `@server/*`. This module
 * re-exports them and keeps the server-side `makeProfileError` helper.
 *
 * Domain raw error messages are NEVER forwarded as-is to the UI; only the safe
 * message embedded here is. Codes are intentionally small and stable so a
 * future HTTP transport can map them 1:1 to status codes.
 */
import type {
  ProfileApplicationError,
  ProfileApplicationErrorCode,
} from "@shared/contracts/profile-view";

export type {
  ProfileApplicationError,
  ProfileApplicationErrorCode,
  ProfileApplicationResult,
} from "@shared/contracts/profile-view";

export function makeProfileError(
  code: ProfileApplicationErrorCode,
  message: string,
  fields?: Record<string, string>,
): ProfileApplicationError {
  return fields ? { code, message, fields } : { code, message };
}
