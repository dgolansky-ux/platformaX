/**
 * notifications-v2 — public API surface (BACKEND_PARTIAL).
 *
 * Other domains, the application layer and the frontend mock-adapter import
 * ONLY from here. Internals (store, mapper, policy, service body, ports
 * implementation) are not importable cross-domain.
 */
export { createNotificationsService } from "./service";
export type {
  NotificationsService,
  NotificationsServiceDeps,
  MarkAllReadOutcome,
} from "./service";
export type {
  NotificationsClock,
  NotificationsErrorCode,
  NotificationsIdGen,
  NotificationsResult,
} from "./service-helpers";
export {
  createInMemoryNotificationRepository,
  createInMemoryNotificationSettingsRepository,
} from "./store";
export type {
  NotificationRepository,
  NotificationRepositoryListFilter,
  NotificationSettingsRepository,
} from "./ports";
export type {
  NotificationCategory,
  NotificationStatus,
  NotificationType,
  NotificationDeliveryChannel,
  NotificationDTO,
  NotificationListDTO,
  NotificationListFilter,
  NotificationUnreadCountDTO,
  NotificationSourceDTO,
} from "./dto";
export type {
  CreateNotificationInput,
  CreateNotificationOutcome,
  ListNotificationsQuery,
  MarkNotificationReadInput,
  MarkAllNotificationsReadInput,
  ArchiveNotificationInput,
} from "./commands";
export type {
  NotificationSettingsDTO,
  NotificationCategorySettingDTO,
  UpdateNotificationSettingsInput,
} from "./settings-dto";
export {
  NOTIFICATION_CATEGORIES,
  NOTIFICATIONS_DEFAULT_LIMIT,
  NOTIFICATIONS_MAX_LIMIT,
  NOTIFICATION_TITLE_MAX,
  NOTIFICATION_BODY_PREVIEW_MAX,
} from "./constants";
export type {
  NotificationActorRef,
  NotificationSourceRef,
  NotificationEventHandlerStatus,
} from "./contracts";
export { isNotificationCategory, isNotificationType } from "./policy";
export {
  NOTIFICATION_EVENT_REGISTRY,
  findRegistryIntegrityViolations,
} from "./event-registry";
export type { NotificationEventRegistryEntry } from "./event-registry";
export type { NotificationsDomainEvent, NotificationCreationRequest } from "./events";
