/**
 * features-v2/media — public feature entrypoint
 * Status: PARTIAL —
 *   - MEDIA_UPLOAD_CLIENT_BOUNDARY_PARTIAL (client-only; transport not connected)
 *
 * app-v2 profile screens consume `mediaAdapter` from here. Types come from the
 * neutral wire contract `@shared/contracts/media-view`; the client never imports
 * `@server/*`. The media domain runtime lives server-side and is reached only
 * through a (future) transport wired into `createMediaAdapter`.
 */
export {
  mediaAdapter,
  createMediaAdapter,
  createNotConnectedMediaPort,
  CLIENT_MEDIA_TRANSPORT_NOT_CONNECTED,
} from "./media-adapter";
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
} from "./types";
