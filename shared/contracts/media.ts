/**
 * shared/contracts/media — canonical media contract types.
 *
 * Single source of truth for cross-boundary media types. Both `client/**`
 * and `server/**` import from here; the server-side media domain re-exports
 * the same names so callers see one shape.
 *
 * `shared/contracts/*` MUST NOT import from `@server/*` — these types are
 * independent definitions, not a mirror that pulls server runtime paths into
 * the client bundle graph. The runtime `MediaService` interface (methods +
 * dependencies) is server-side and is NOT re-exposed here; clients depend on
 * the `MediaUploadAdapter` contract instead.
 */

/** What a media asset is attached to within a profile. */
export type MediaPurpose = "avatar" | "banner" | "statusPhoto";

/** Lifecycle of an asset. `ready` means a public URL is resolvable. */
export type MediaAssetStatus = "pending" | "ready" | "failed";

/** Stable, opaque reference other domains store instead of the asset itself. */
export type MediaRefDTO = {
  assetId: string;
};

/** Opaque reference identity (and others) persist instead of an asset. */
export type MediaAssetRef = {
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

/**
 * Metadata describing a file the client wants to upload. The client computes
 * this from the selected `File` (type + size, optional intrinsic dimensions).
 * The raw bytes never cross this boundary — there is no inline payload field.
 */
export type UploadFileMeta = {
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  /**
   * Optional client-proposed source URI. Inline `data:` scheme refs are
   * rejected by validation — uploads go through a storage target, not inline.
   */
  sourceUri?: string | null;
};

export type MediaErrorCode =
  | "INVALID_INPUT"
  | "UNSUPPORTED_TYPE"
  | "TOO_LARGE"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "NOT_READY"
  | "STORAGE_UNAVAILABLE";

export type MediaError = {
  code: MediaErrorCode;
  message: string;
  /** Optional field-level validation map. Safe for UI display. */
  fields?: Record<string, string>;
};

/** Discriminated result for owner-gated media use-cases. */
export type MediaResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: MediaError };

/* ---------- Adapter contract (client + server agree on this shape) ---------- */

export type CreateUploadIntentResult = MediaResult<UploadIntentDTO>;
export type ConfirmUploadResult = MediaResult<MediaAssetDTO>;
export type GetMediaUrlResult = MediaResult<MediaAssetDTO>;

/**
 * Adapter contract the client UI depends on. Both the client-side mock adapter
 * (MOCK_LOCAL_ONLY, BACKEND_NOT_STARTED) and the future HTTP transport adapter
 * implement this same shape. `isStorageConnected()` answers honestly — `false`
 * while no real storage backend is wired — so the UI can surface that rather
 * than pretending bytes were stored.
 */
export type MediaUploadAdapter = {
  isStorageConnected(): boolean;
  createAvatarUploadIntent(
    userId: string,
    meta: UploadFileMeta,
  ): Promise<CreateUploadIntentResult>;
  createBannerUploadIntent(
    userId: string,
    meta: UploadFileMeta,
  ): Promise<CreateUploadIntentResult>;
  createStatusPhotoUploadIntent(
    userId: string,
    meta: UploadFileMeta,
  ): Promise<CreateUploadIntentResult>;
  confirmProfileMediaUpload(
    userId: string,
    assetId: string,
  ): Promise<ConfirmUploadResult>;
  getPublicMediaUrl(ref: MediaRefDTO): Promise<GetMediaUrlResult>;
};
