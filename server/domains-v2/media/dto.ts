/**
 * media — public data transfer objects.
 *
 * Cross-boundary types live in `@shared/contracts/media` so the client never
 * needs to import from `@server/*`. This file re-exports them so existing
 * `from "./dto"` imports inside the media domain keep working without further
 * indirection. They MUST stay PII-free and MUST NOT leak storage internals
 * (storage key, owner id, byte size or storage backend identity — those live
 * in `./internal/record.ts`).
 */
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
  UploadTransportState,
  UploadIntentDTO,
  UploadFileMeta,
  CreateUploadIntentInput,
  CompleteUploadInput,
  MediaPurposeDefinitionDTO,
  MediaValidationErrorDTO,
} from "@shared/contracts/media";
