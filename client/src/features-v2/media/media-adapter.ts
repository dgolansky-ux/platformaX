/**
 * features-v2/media — runtime adapter (client-only, split-ready).
 *
 * The frontend MUST NOT bundle server runtime. This module exposes:
 *  - `createMediaAdapter(port)` — wraps any `MediaServicePort` (e.g. a future
 *    HTTP transport) into the frontend `MediaUploadAdapter`.
 *  - `mediaAdapter` — the default adapter. There is no storage transport yet, so
 *    it is an explicit client-only stub (`CLIENT_MEDIA_TRANSPORT_NOT_CONNECTED`)
 *    that returns a typed `STORAGE_UNAVAILABLE` result and reports
 *    `isStorageConnected() === false`. It never composes the media service in the
 *    browser, never touches browser storage and never inline-encodes bytes.
 *
 * The real media validation + intent runtime lives server-side in
 * `server/domains-v2/media` and is tested there.
 */
import type {
  MediaResult,
  MediaServicePort,
} from "@shared/contracts/media-view";
import type { MediaUploadAdapter } from "./types";

export type MediaAdapterDeps = {
  port: MediaServicePort;
  storageConnected: boolean;
};

export function createMediaAdapter(deps: MediaAdapterDeps): MediaUploadAdapter {
  const { port } = deps;
  return {
    isStorageConnected: () => deps.storageConnected,
    createAvatarUploadIntent: (userId, meta) =>
      port.createAvatarUploadIntent(userId, meta),
    createBannerUploadIntent: (userId, meta) =>
      port.createBannerUploadIntent(userId, meta),
    createStatusPhotoUploadIntent: (userId, meta) =>
      port.createStatusPhotoUploadIntent(userId, meta),
    confirmProfileMediaUpload: (userId, assetId) =>
      port.confirmProfileMediaUpload(userId, assetId),
    getPublicMediaUrl: (ref) => port.getPublicMediaUrl(ref),
  };
}

/** Marker for the disconnected default — there is no storage transport wired yet. */
export const CLIENT_MEDIA_TRANSPORT_NOT_CONNECTED =
  "CLIENT_MEDIA_TRANSPORT_NOT_CONNECTED" as const;

function notConnected(): MediaResult<never> {
  return {
    ok: false,
    error: {
      code: "STORAGE_UNAVAILABLE",
      message:
        "Przesyłanie plików nie jest jeszcze połączone z serwerem. Transport zostanie podłączony w kolejnym kroku.",
    },
  };
}

/**
 * Client-only port stub. Every call honestly reports that storage is not
 * connected — no server runtime is bundled and nothing is uploaded.
 */
export function createNotConnectedMediaPort(): MediaServicePort {
  return {
    createAvatarUploadIntent: async () => notConnected(),
    createBannerUploadIntent: async () => notConnected(),
    createStatusPhotoUploadIntent: async () => notConnected(),
    confirmProfileMediaUpload: async () => notConnected(),
    getPublicMediaUrl: async () => notConnected(),
  };
}

export const mediaAdapter: MediaUploadAdapter = createMediaAdapter({
  port: createNotConnectedMediaPort(),
  storageConnected: false,
});
