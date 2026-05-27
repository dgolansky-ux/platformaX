/**
 * features-v2/media — runtime adapter.
 *
 * Wires the media backend domain to the frontend through a thin typed boundary.
 * It composes the media service with an in-memory repository and the
 * env-required storage port: validation and intent creation run for real, but
 * there is no connected storage backend yet (STORAGE_ADAPTER_ENV_REQUIRED), so
 * `isStorageConnected()` is `false` and an actual upload cannot complete.
 *
 * When a Supabase Storage adapter is wired, swap `createEnvRequiredStoragePort`
 * for the real `MediaStoragePort`; this frontend contract does not change.
 */
import {
  createEnvRequiredStoragePort,
  createInMemoryMediaRepository,
  createMediaService,
  type MediaService,
  type MediaStoragePort,
} from "@server/domains-v2/media/public-api";
import type { MediaUploadAdapter } from "./types";

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

const defaultStorage: MediaStoragePort = createEnvRequiredStoragePort();
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
