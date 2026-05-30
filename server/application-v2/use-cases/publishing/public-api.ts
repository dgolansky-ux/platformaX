/**
 * application-v2/use-cases/publishing — public API (Slice 17).
 * Other layers import only from this file.
 */
export { createPublishingTargetRegistry } from "./registry";
export type {
  PublishingTargetRegistry,
  PublishingTargetRegistryDeps,
} from "./registry";

export { createPublishingService } from "./service";
export type {
  PublishingService,
  PublishingServiceDeps,
} from "./service";

export { buildPublishingPreview } from "./preview";
export type { BuildPreviewDeps } from "./preview";

export type {
  PublishingCommand,
  PublishingResult,
  PublishingResultStatus,
  PublishingPreview,
  PublishingTargetDefinition,
  PublishingTargetType,
  PublishingTargetStatus,
  PublishingTargetOwnerType,
  PublishingContentType,
  PublishingVisibility,
  PublishingMediaRef,
  PublishingMediaType,
  PublishingFeedEffects,
  PublishedEntityRef,
  PublishingError,
  PublishingErrorCode,
  PublishingBlockedReason,
  PublishingRequestContext,
} from "./contracts";

export { PUBLISHING_LIMITS, buildEmptyFeedEffects } from "./contracts";
