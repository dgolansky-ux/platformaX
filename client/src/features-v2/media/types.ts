/**
 * features-v2/media — typed boundary for app-v2 profile media uploads.
 *
 * app-v2 never imports the media backend domain directly. It depends on the
 * typed adapter exposed here, which translates UI inputs into the media
 * service's `MediaResult`. Backend types come via
 * `@server/domains-v2/media/public-api` (the only cross-domain entry point);
 * both ends share the domain name "media", so this stays within boundaries.
 */
import type {
  MediaAssetDTO,
  MediaPurpose,
  MediaRefDTO,
  MediaResult,
  UploadFileMeta,
  UploadIntentDTO,
} from "@server/domains-v2/media/public-api";

export type CreateUploadIntentResult = MediaResult<UploadIntentDTO>;
export type ConfirmUploadResult = MediaResult<MediaAssetDTO>;
export type GetMediaUrlResult = MediaResult<MediaAssetDTO>;

export type MediaUploadAdapter = {
  /**
   * Whether a real storage backend is wired. The current adapter returns
   * `false` (env-required) — uploads validate and create an intent, but bytes
   * cannot actually be stored yet.
   */
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

export type {
  UploadFileMeta,
  UploadIntentDTO,
  MediaAssetDTO,
  MediaRefDTO,
  MediaPurpose,
};
