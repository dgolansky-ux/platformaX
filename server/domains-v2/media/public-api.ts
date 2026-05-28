/**
 * media — public API surface
 *
 * The only entry point other domains and the frontend adapter may depend on.
 * Exposes the service factory, the public DTOs, contracts, policy helpers,
 * validation limits, repository/storage *port interfaces* and event types.
 *
 * The in-memory repository and env-required storage *implementation factories*
 * (`createInMemoryMediaRepository`, `createEnvRequiredStoragePort`) are
 * intentionally NOT public — server-side composition (today: tests; future:
 * an HTTP/Supabase wiring under `server/`) imports them from `./repository`
 * directly. Port interfaces are re-exported via `./ports`, limits via `./limits`.
 * Internal modules (mapper, internal/record, internal/validation impl details)
 * stay unexposed.
 */
export { createMediaService } from "./service";
export type {
  MediaService,
  MediaServiceDeps,
  MediaClock,
  MediaIdGenerator,
  MediaEventPublisher,
} from "./service";

export type {
  MediaRepository,
  MediaStoragePort,
  CreateMediaRecordInput,
  UpdateMediaRecordPatch,
  UploadTarget,
  UploadTargetRequest,
} from "./ports";

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
} from "./limits";

export type {
  MediaEvent,
  MediaUploadIntentCreatedEvent,
  MediaUploadConfirmedEvent,
  MediaEventEnvelope,
} from "./events";
