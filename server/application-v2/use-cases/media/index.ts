/**
 * application-v2/use-cases/media — barrel.
 *
 * Re-exports the public-api surface only. The transport / wiring layer imports
 * from here; internal modules (`service.ts`, `permissions.ts`, `errors.ts`)
 * are not directly importable by other application-v2 use-cases — go through
 * `./public-api`.
 */
export * from "./public-api";
