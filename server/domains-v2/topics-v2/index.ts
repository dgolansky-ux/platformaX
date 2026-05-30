/**
 * topics-v2 — domain barrel re-exports the public surface only.
 * Other domains must NEVER import internal/* paths or anything not in
 * public-api.ts. Status: FOUNDATION_READY.
 */
export * from "./public-api";
