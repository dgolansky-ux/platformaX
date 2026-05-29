/**
 * identity — private profile DTO (domain-root facade).
 *
 * `PrivateProfileDTO` is an owner-only return type that lives under `/internal/`
 * for the PII guard. `public-api.ts` must not export from `./internal/*`, so it
 * re-exports the type through this domain-root module instead. The internal file
 * remains the single source of truth.
 */
export type { PrivateProfileDTO } from "./internal/private-profile-dto";
