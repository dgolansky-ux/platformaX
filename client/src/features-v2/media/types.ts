/**
 * features-v2/media — typed boundary for app-v2 media uploads (all surfaces).
 *
 * app-v2 never imports the media backend domain directly. It depends on the
 * `MediaUploadAdapter` contract from `@shared/contracts/media`, implemented
 * today by the local mock adapter (MOCK_LOCAL_ONLY, STORAGE_ADAPTER_ENV_REQUIRED)
 * and tomorrow by an HTTP transport. Types come from `@shared/contracts/media` —
 * never directly from `@server/*`.
 */
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
  MediaError,
  MediaErrorCode,
  MediaResult,
} from "@shared/contracts/media";
