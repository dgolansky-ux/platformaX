/**
 * shared/wiring/media-wiring — in-memory composition boundary for the media feature.
 *
 * This module is the ONLY place allowed to import `@server/*` factories for
 * composition in the current in-memory boundary phase.  When a real HTTP/RPC
 * transport is wired, replace this file with an HTTP client adapter; the
 * `MediaUploadAdapter` contract does not change.
 *
 * `client/**` imports `mediaAdapter` / `createMediaAdapter` from here (via
 * `@client/features-v2/media`) so it NEVER directly touches `@server/*` paths.
 */
import { createMediaService } from "@server/domains-v2/media/public-api";
import {
  createEnvRequiredStoragePort,
  createInMemoryMediaRepository,
} from "@server/domains-v2/media/repository";
import type { MediaService } from "@shared/contracts/media";
import type {
  MediaAssetDTO,
  MediaPurpose,
  MediaRefDTO,
  MediaResult,
  UploadFileMeta,
  UploadIntentDTO,
} from "@shared/contracts/media";

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

export type MediaAdapterDeps = {
  service: MediaService;
  storageConnected: boolean;
};

export function createMediaAdapter(deps: MediaAdapterDeps): MediaUploadAdapter {
  return {
    isStorageConnected: () => deps.storageConnected,
    createAvatarUploadIntent: (userId, meta) =>
      deps.service.createAvatarUploadIntent(userId, meta),
    createBannerUploadIntent: (userId, meta) =>
      deps.service.createBannerUploadIntent(userId, meta),
    createStatusPhotoUploadIntent: (userId, meta) =>
      deps.service.createStatusPhotoUploadIntent(userId, meta),
    confirmProfileMediaUpload: (userId, assetId) =>
      deps.service.confirmProfileMediaUpload(userId, assetId),
    getPublicMediaUrl: (ref) => deps.service.getPublicMediaUrl(ref),
  };
}

const defaultStorage = createEnvRequiredStoragePort();
const defaultService = createMediaService({
  repository: createInMemoryMediaRepository(),
  storage: defaultStorage,
});

/**
 * Default media adapter shared across the app. Storage is not connected yet, so
 * uploads validate and produce an intent but cannot be completed — the UI must
 * surface that honestly instead of faking success.
 */
export const mediaAdapter: MediaUploadAdapter = createMediaAdapter({
  service: defaultService,
  storageConnected: defaultStorage.isConnected(),
});

export type { MediaPurpose, UploadFileMeta, UploadIntentDTO, MediaAssetDTO, MediaRefDTO };
