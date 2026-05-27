/**
 * Media wire contract — public DTOs, upload inputs, result/error shapes and the
 * media service port.
 *
 * Rule: split-ready. The client imports these instead of `@server/*`. The media
 * domain owns the runtime; these are the neutral, PII-free, storage-internal-free
 * boundary types. `MediaPurpose` mirrors the domain union in
 * server/domains-v2/media/dto.ts (kept in sync by check-media-purpose-migration).
 */

export type MediaPurpose = "avatar" | "banner" | "statusPhoto";

export type MediaAssetStatus = "pending" | "ready" | "failed";

export type MediaRefDTO = {
  assetId: string;
};

/** Public-safe asset projection. Never includes storageKey/ownerId/sizeBytes. */
export type MediaAssetDTO = {
  assetId: string;
  purpose: MediaPurpose;
  status: MediaAssetStatus;
  url: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
};

export type UploadTransportState = "READY" | "ENV_REQUIRED";

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

/** Client-supplied metadata describing the file to upload. */
export type UploadFileMeta = {
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  /** Optional source ref. Inline data: schemes are rejected by the domain. */
  sourceUri?: string;
};

export type MediaErrorCode =
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "UNSUPPORTED_TYPE"
  | "TOO_LARGE"
  | "NOT_READY"
  | "STORAGE_UNAVAILABLE";

export type MediaError = {
  code: MediaErrorCode;
  message: string;
  fields?: Record<string, string>;
};

export type MediaResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: MediaError };

/** Transport-neutral media boundary used by the frontend upload flow. */
export interface MediaServicePort {
  createAvatarUploadIntent(
    userId: string,
    meta: UploadFileMeta,
  ): Promise<MediaResult<UploadIntentDTO>>;
  createBannerUploadIntent(
    userId: string,
    meta: UploadFileMeta,
  ): Promise<MediaResult<UploadIntentDTO>>;
  createStatusPhotoUploadIntent(
    userId: string,
    meta: UploadFileMeta,
  ): Promise<MediaResult<UploadIntentDTO>>;
  confirmProfileMediaUpload(
    userId: string,
    assetId: string,
  ): Promise<MediaResult<MediaAssetDTO>>;
  getPublicMediaUrl(ref: MediaRefDTO): Promise<MediaResult<MediaAssetDTO>>;
}
