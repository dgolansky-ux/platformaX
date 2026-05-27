/**
 * features-v2/media — typed boundary for app-v2 profile media uploads.
 *
 * app-v2 depends on the typed adapter exposed here. All media types come from
 * the neutral wire contract `@shared/contracts/media-view` — the client never
 * imports `@server/*` (split-ready). The media domain owns the runtime.
 */
import type {
  MediaAssetDTO,
  MediaResult,
  MediaServicePort,
  UploadIntentDTO,
} from "@shared/contracts/media-view";

export type CreateUploadIntentResult = MediaResult<UploadIntentDTO>;
export type ConfirmUploadResult = MediaResult<MediaAssetDTO>;
export type GetMediaUrlResult = MediaResult<MediaAssetDTO>;

/**
 * Frontend media adapter = the media service port plus an honesty flag about
 * whether a real storage backend is wired.
 */
export type MediaUploadAdapter = MediaServicePort & {
  /** Whether a real storage backend is connected. Transport-less = false. */
  isStorageConnected(): boolean;
};

export type {
  UploadFileMeta,
  UploadIntentDTO,
  MediaAssetDTO,
  MediaRefDTO,
  MediaPurpose,
} from "@shared/contracts/media-view";
