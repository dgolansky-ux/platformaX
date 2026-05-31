/**
 * features-v2/media — public feature entrypoint.
 *
 * Status: PARTIAL —
 *   - MEDIA_RUNTIME_PARTIAL (mock local adapter, env-required storage)
 *   - VARIANT_PROCESSING_SKELETON (variants advertised, no real pipeline)
 *
 * app-v2 screens consume the components and `mediaAdapter` from here. The
 * backend domain (server/domains-v2/media) is intentionally unreachable from
 * `client/**` (no `@server/*` imports, no `@shared/wiring`); the default
 * `mediaAdapter` is a MOCK_LOCAL_ONLY adapter that satisfies the same contract
 * a future HTTP transport will.
 */

// Adapter + types
export { mediaAdapter, createMockMediaAdapter } from "./media-adapter";
export type {
  MediaUploadAdapter,
  CreateUploadIntentInput,
  CreateUploadIntentResult,
  CompleteUploadInput,
  ConfirmUploadResult,
  GetMediaUrlResult,
  ListOwnerAssetsResult,
  UploadFileMeta,
  UploadIntentDTO,
  UploadTransportState,
  MediaAssetDTO,
  MediaAssetStatus,
  MediaRefDTO,
  MediaVariantDTO,
  MediaVariantType,
  MediaVariantStatus,
  MediaPurpose,
  MediaOwnerType,
  MediaOwnerRefDTO,
  MediaVisibility,
  MediaPurposeDefinitionDTO,
} from "./types";

// Hooks + helpers
export { useMediaUpload } from "./useMediaUpload";
export type {
  UseMediaUploadConfig,
  MediaUploadPhase,
  MediaUploadState,
} from "./useMediaUpload";

export {
  validateFileForPurpose,
  validateFileCount,
  metaFromFile,
  purposeAcceptAttr,
  generateIdempotencyKey,
} from "./mediaValidation";
export type { LocalValidationError } from "./mediaValidation";

export { resolveDisplayUrl } from "./mediaVariantResolver";
export type { DisplayVariantNeed } from "./mediaVariantResolver";

// Components
export { MediaPicker } from "./MediaPicker";
export { MediaPreviewGrid } from "./MediaPreviewGrid";
export type { MediaPreviewItem } from "./MediaPreviewGrid";
export { MediaPurposeHint } from "./MediaPurposeHint";
export { MediaUploadBlockedState } from "./MediaUploadBlockedState";
export { AvatarUploader } from "./AvatarUploader";
export { BannerUploader } from "./BannerUploader";
export { BrokenMediaFallback } from "./BrokenMediaFallback";
export { MediaSkeleton } from "./MediaSkeleton";
