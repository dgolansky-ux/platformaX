/**
 * identity — barrel export
 *
 * Re-exports the public-api surface only. Internal modules (service.ts
 * factory excepted) are NOT re-exported here — consumers must go through
 * `public-api.ts`.
 */
export * from "./public-api";
