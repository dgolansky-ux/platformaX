/**
 * features-v2/media — public feature entrypoint
 * Status: PARTIAL —
 *   - MEDIA_AVATAR_BANNER_RUNTIME_PARTIAL (in-memory boundary, env-required storage)
 *
 * app-v2 profile screens consume `mediaAdapter` from here. The backend domain
 * (server/domains-v2/media) is only reachable via `@shared/wiring/media-wiring`;
 * no `@server/*` imports exist anywhere in `client/**`.
 */
export { mediaAdapter, createMediaAdapter } from "./media-adapter";
export type {
  MediaUploadAdapter,
  MediaAdapterDeps,
  CreateUploadIntentResult,
  ConfirmUploadResult,
  GetMediaUrlResult,
  UploadFileMeta,
  UploadIntentDTO,
  MediaAssetDTO,
  MediaRefDTO,
  MediaPurpose,
} from "./types";
