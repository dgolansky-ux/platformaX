/**
 * identity — public validation limits (domain-root facade).
 *
 * `public-api.ts` must not export from `./internal/*`. The limits themselves
 * are a stable public constant, so this domain-root module re-exports them and
 * keeps `internal/validation.ts` as the single source of truth.
 */
export { IDENTITY_VALIDATION_LIMITS } from "./internal/validation";
