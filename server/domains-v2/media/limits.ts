/**
 * media — public validation limits (domain-root facade).
 *
 * `public-api.ts` must not export from `./internal/*`. These limits are stable
 * public constants, so this domain-root module re-exports them and keeps
 * `internal/validation.ts` as the single source of truth. Per-purpose limits
 * are now resolved through `getPurposeDefinition(purpose)`.
 */
export {
  MEDIA_VALIDATION_LIMITS,
  ALLOWED_MIME_TYPES,
  maxBytesFor,
  maxFilesFor,
  allowedMimeFor,
} from "./internal/validation";
