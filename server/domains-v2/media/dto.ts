/**
 * media — data transfer objects (Public DTOs + Owner-only command result).
 *
 * This file declares both Public-safe types and an Owner-only command result.
 * The two classes are intentionally separated and named so future readers and
 * mappers cannot conflate them.
 *
 * Privacy: classification table (per `scripts/check-dto-privacy-classification.mjs`):
 *  - `MediaRefDTO`           — Public. Opaque ref other domains store.
 *  - `MediaAssetDTO`         — Public. Read projection. Never includes
 *                              storageKey / ownerId / provider / sizeBytes.
 *  - `OwnerUploadIntentDTO`  — OWNER_ONLY. Carries owner-only upload instructions
 *                              (`uploadUrl`, `storageKey`, `maxBytes`) and is
 *                              returned only from owner-gated commands such as
 *                              `createAvatarUploadIntent(ownerUserId, …)`.
 *                              MUST NOT appear in public read responses.
 */

/** What a media asset is attached to within a profile. */
export type MediaPurpose = "avatar" | "banner" | "statusPhoto";

/** Lifecycle of an asset. `ready` means a public URL is resolvable. */
export type MediaAssetStatus = "pending" | "ready" | "failed";

/** PUBLIC_SAFE — stable, opaque reference other domains store instead of the asset itself. */
export type MediaRefDTO = {
  assetId: string;
};

/**
 * PUBLIC_SAFE — public projection of an asset. Never includes the storage key,
 * owner id, byte size or storage backend identity.
 */
export type MediaAssetDTO = {
  assetId: string;
  purpose: MediaPurpose;
  status: MediaAssetStatus;
  /** Public URL when the asset is `ready`; null while pending/unbacked. */
  url: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
};

/** Honest transport state of the upload destination. */
export type UploadTransportState = "READY" | "ENV_REQUIRED";

/**
 * OWNER_ONLY_UPLOAD_INTENT — instruction the OWNER uses to push bytes directly
 * to storage (presigned-style).
 *
 * Carries owner-only details that MUST NOT be exposed to non-owners:
 *  - `uploadUrl` (presigned PUT/POST target),
 *  - `storageKey` (internal storage path),
 *  - `maxBytes`  (owner-visible upload limit).
 *
 * `uploadUrl` is null and `transport` is `ENV_REQUIRED` while no storage
 * backend is wired — the UI must surface that instead of faking a successful
 * upload.
 *
 * Public read paths must return `MediaAssetDTO`, never this type.
 */
export type OwnerUploadIntentDTO = {
  assetId: string;
  purpose: MediaPurpose;
  /** Owner-only. */
  uploadUrl: string | null;
  method: "PUT" | "POST";
  /** Owner-only. Internal storage path; never sent to non-owners. */
  storageKey: string;
  /** Owner-only. */
  maxBytes: number;
  mimeType: string;
  transport: UploadTransportState;
  expiresAt: string | null;
};

/**
 * @deprecated Use `OwnerUploadIntentDTO`. This alias preserves the old name
 * for any third-party consumer that imported it from `public-api.ts`; it will
 * be removed once the rename has propagated across the codebase.
 */
export type UploadIntentDTO = OwnerUploadIntentDTO;
