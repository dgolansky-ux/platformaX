/**
 * application-v2/use-cases/profile — application-level error contract.
 *
 * The profile application boundary translates identity / media domain errors
 * into a single, frontend-safe code-set. Domain raw error messages are NEVER
 * forwarded as-is to the UI; only the safe message embedded here is.
 *
 * Codes are intentionally small and stable so a future HTTP transport can map
 * them 1:1 to status codes without leaking domain internals. The canonical
 * shape lives in `@shared/contracts/profile` so the client adapter can react
 * to the same codes without importing from `@server/*`.
 */
export type {
  ProfileApplicationErrorCode,
  ProfileApplicationError,
  ProfileApplicationResult,
} from "@shared/contracts/profile";
export { makeProfileError } from "@shared/contracts/profile";
