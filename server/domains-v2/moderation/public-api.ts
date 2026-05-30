/**
 * moderation — public API surface (Slice 20 foundation).
 *
 * Other domains may import only from this file. Internal modules
 * (repository, service, policy, mapper) must NOT be reached cross-domain.
 */
export { createModerationService } from "./service";
export type {
  ModerationService,
  ModerationServiceDeps,
  ModerationClock,
  ModerationIdGen,
} from "./service";

export type {
  ModerationActor,
  PlatformRole,
} from "./policy";
export {
  canCreateReport,
  canReviewReports,
  canTakeAction,
  canViewOwnReportStatus,
  canReportSelfTarget,
  MODERATION_DESCRIPTION_MAX_CHARS,
} from "./policy";

export type {
  CreateModerationReportInput,
  ListModerationReportsInput,
  ModerateReportActionInput,
  ModerationActionDTO,
  ModerationErrorCode,
  ModerationReportListDTO,
  ModerationReportPublicStatusDTO,
  ModerationReportReviewDTO,
  ModerationResult,
  ModerationTargetPreviewDTO,
} from "./dto";

export type {
  ModerationTargetType,
  ModerationReportReason,
  ModerationReportSeverity,
  ModerationReportStatus,
  ModerationActionType,
  ModerationTargetActionStatus,
  ModerationTargetDefinition,
  ModerationReportReasonDefinition,
} from "./contracts";
export {
  MODERATION_TARGET_TYPES,
  MODERATION_REPORT_REASONS,
  MODERATION_REPORT_REASON_DEFINITIONS,
  MODERATION_TARGET_DEFINITIONS,
  findReportReasonDefinition,
  findTargetDefinition,
  isKnownReportReason,
  isKnownTargetType,
} from "./contracts";

export {
  createNoopModerationEventPublisher,
} from "./events";
export type {
  ModerationDomainEvent,
  ModerationEventPublisher,
  ModerationReportCreatedEvent,
  ModerationReportReviewedEvent,
  ModerationActionTakenEvent,
} from "./events";

export { createInMemoryModerationRepository } from "./moderation-store";
export type {
  ModerationRepository,
  ModerationReportRecord,
  ModerationActionRecord,
} from "./moderation-store";
