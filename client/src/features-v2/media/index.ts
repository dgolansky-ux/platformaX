/**
 * features-v2/media — public feature entrypoint
 *
 * Status: PARTIAL —
 *   - MEDIA_AVATAR_BANNER_RUNTIME_PARTIAL (mock local adapter, env-required storage)
 *
 * app-v2 profile screens consume `mediaAdapter` from here. The backend domain
 * (server/domains-v2/media) is intentionally unreachable from `client/**` (no
 * `@server/*` imports, no `@shared/wiring`); the default mediaAdapter is a
 * MOCK_LOCAL_ONLY adapter that satisfies the same contract a future HTTP
 * transport will.
 */
export { mediaAdapter, createMockMediaAdapter } from "./media-adapter";
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
