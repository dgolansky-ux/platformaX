/**
 * media — public API surface (V2).
 *
 * The only entry point other domains and the frontend adapter may depend on.
 * Exposes the service factory, the purpose registry, the public DTOs,
 * contracts, policy helpers, validation limits, repository/storage *port
 * interfaces* and event types.
 *
 * In-memory repository/intent repository and env-required storage
 * *implementation factories* (`createInMemoryMediaRepository`,
 * `createInMemoryUploadIntentRepository`, `createEnvRequiredStoragePort`) are
 * intentionally NOT public — server-side composition (today: tests; future:
 * an HTTP/Supabase wiring under `server/`) imports them from `./repository`
 * directly. Port interfaces are re-exported via `./ports`, limits via
 * `./limits`. Internal modules (mapper, internal/record, internal/validation
 * impl details, internal/envelope) stay unexposed.
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
  UploadIntentRepository,
  MediaStoragePort,
  CreateMediaRecordInput,
  UpdateMediaRecordPatch,
  CreateUploadIntentRecordInput,
  CreateVariantInput,
  UploadTarget,
  UploadTargetRequest,
} from "./ports";

export type {
  MediaPurpose,
  ProfileMediaPurpose,
  FriendFeedMediaPurpose,
  CommunityMediaPurpose,
  ChannelMediaPurpose,
  WorkplaceMediaPurpose,
  EventMediaPurpose,
  NewsletterMediaPurpose,
  MediaOwnerType,
  MediaOwnerRefDTO,
  MediaAssetStatus,
  MediaVisibility,
  MediaVariantType,
  MediaVariantStatus,
  MediaVariantDTO,
  MediaRefDTO,
  MediaAssetDTO,
  UploadIntentDTO,
  UploadTransportState,
  UploadFileMeta,
  CreateUploadIntentInput,
  CompleteUploadInput,
  MediaPurposeDefinitionDTO,
  MediaValidationErrorDTO,
} from "./dto";

export type {
  MediaAssetRef,
  MediaResult,
  MediaError,
  MediaErrorCode,
} from "./contracts";

export {
  canCreateUploadIntent,
  canConfirmUpload,
  canDeleteMediaAsset,
  canReadMediaAsset,
} from "./policy";
export type { MediaViewerRole, MediaReadContext } from "./policy";

export {
  MEDIA_VALIDATION_LIMITS,
  ALLOWED_MIME_TYPES,
  maxBytesFor,
  maxFilesFor,
  allowedMimeFor,
} from "./limits";

export {
  getPurposeDefinition,
  listPurposeDefinitions,
  isMediaPurpose,
  buildStoragePath,
  STORAGE_PATH_PATTERN,
} from "./purpose-registry";

export type {
  MediaEvent,
  MediaUploadIntentCreatedEvent,
  MediaUploadConfirmedEvent,
  MediaAssetDeletedEvent,
  MediaEventEnvelope,
} from "./events";
