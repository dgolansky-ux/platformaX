/**
 * features-v2/media — typed boundary for app-v2 profile media uploads.
 *
 * app-v2 never imports the media backend domain directly. It depends on the
 * typed adapter exposed here. Types come from `@shared/contracts/media` —
 * never directly from `@server/*`.
 */
export type {
  MediaUploadAdapter,
  MediaAdapterDeps,
  CreateUploadIntentResult,
  ConfirmUploadResult,
  GetMediaUrlResult,
} from "@shared/wiring/media-wiring";

export type {
  UploadFileMeta,
  UploadIntentDTO,
  MediaAssetDTO,
  MediaRefDTO,
  MediaPurpose,
} from "@shared/contracts/media";
