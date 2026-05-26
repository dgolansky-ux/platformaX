/**
 * media — cross-domain contracts
 *
 * Stable types other domains (identity, content-v2, …) may depend on. Only
 * types/constants — never runtime. Identity stores `MediaAssetRef` on a profile
 * and never the asset payload itself.
 */

/** Opaque reference identity (and others) persist instead of an asset. */
export type MediaAssetRef = {
  assetId: string;
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
