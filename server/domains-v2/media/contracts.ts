/**
 * media — cross-domain contracts.
 *
 * Stable types other domains (identity, content-v2, …) may depend on. Canonical
 * definitions live in `@shared/contracts/media` so the client never imports
 * from `@server/*`; this file re-exports them so existing media-domain imports
 * keep working unchanged. Identity stores `MediaAssetRef` on a profile and
 * never the asset payload itself.
 */
export type {
  MediaAssetRef,
  UploadFileMeta,
  MediaErrorCode,
  MediaError,
  MediaResult,
} from "@shared/contracts/media";
