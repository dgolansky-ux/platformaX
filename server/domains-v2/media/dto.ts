/**
 * media — public data transfer objects
 *
 * Public DTOs exposed across the public-api boundary. They MUST stay PII-free
 * and MUST NOT leak storage internals (storage key, owner id, byte size or the
 * storage backend identity — those live in `./internal/record.ts`).
 */

/** What a media asset is attached to within a profile. */
export type MediaPurpose = "avatar" | "banner";

/** Lifecycle of an asset. `ready` means a public URL is resolvable. */
export type MediaAssetStatus = "pending" | "ready" | "failed";

/** Stable, opaque reference other domains store instead of the asset itself. */
export type MediaRefDTO = {
  assetId: string;
};

/**
 * Public-safe projection of an asset. Never includes the storage key, owner id,
 * byte size or storage backend identity.
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
 * Instruction the client uses to push bytes directly to storage (presigned-style).
 * `uploadUrl` is null and `transport` is `ENV_REQUIRED` while no storage backend
 * is wired — the UI must surface that instead of faking a successful upload.
 */
export type UploadIntentDTO = {
  assetId: string;
  purpose: MediaPurpose;
  uploadUrl: string | null;
  method: "PUT" | "POST";
  storageKey: string;
  maxBytes: number;
  mimeType: string;
  transport: UploadTransportState;
  expiresAt: string | null;
};
