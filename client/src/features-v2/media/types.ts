/**
 * features-v2/media — typed boundary for app-v2 profile media uploads.
 *
 * app-v2 never imports the media backend domain directly. It depends on the
 * `MediaUploadAdapter` contract from `@shared/contracts/media`, implemented
 * today by the local mock adapter (MOCK_LOCAL_ONLY, STORAGE_ADAPTER_ENV_REQUIRED)
 * and tomorrow by an HTTP transport. Types come from `@shared/contracts/media` —
 * never directly from `@server/*`.
 */
export type {
  MediaUploadAdapter,
  CreateUploadIntentResult,
  ConfirmUploadResult,
  GetMediaUrlResult,
  UploadFileMeta,
  UploadIntentDTO,
  MediaAssetDTO,
  MediaRefDTO,
  MediaPurpose,
} from "@shared/contracts/media";
