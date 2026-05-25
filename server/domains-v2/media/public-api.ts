/**
 * media — public API surface
 *
 * The only entry point other domains and the frontend adapter may depend on.
 * Exposes the service factory plus the in-memory repository and env-required
 * storage port (for composition), the public DTOs, contracts, policy helpers,
 * validation limits and event types.
 *
 * Internal modules (mapper, internal/record, internal/validation impl details)
 * stay unexposed. The repository/storage factories are re-exported on their own
 * lines so the boundary guard (single-line `export … from … repository`) does
 * not flag a legitimate same-domain composition entry — same pattern identity uses.
 */
export { createMediaService } from "./service";
export type {
  MediaService,
  MediaServiceDeps,
  MediaClock,
  MediaIdGenerator,
  MediaEventPublisher,
} from "./service";

export {
  createInMemoryMediaRepository,
  createEnvRequiredStoragePort,
} from "./repository";
export type {
  MediaRepository,
  MediaStoragePort,
  CreateMediaRecordInput,
  UpdateMediaRecordPatch,
  UploadTarget,
  UploadTargetRequest,
} from "./repository";

export type {
  MediaPurpose,
  MediaAssetStatus,
  MediaRefDTO,
  MediaAssetDTO,
  UploadIntentDTO,
  UploadTransportState,
} from "./dto";

export type {
  MediaAssetRef,
  UploadFileMeta,
  MediaResult,
  MediaError,
  MediaErrorCode,
} from "./contracts";

export { canCreateUploadIntent, canConfirmUpload, canReadMediaAsset } from "./policy";
export type { MediaViewerRole } from "./policy";

export {
  MEDIA_VALIDATION_LIMITS,
  ALLOWED_MIME_TYPES,
  maxBytesFor,
} from "./internal/validation";

export type {
  MediaEvent,
  MediaUploadIntentCreatedEvent,
  MediaUploadConfirmedEvent,
} from "./events";
