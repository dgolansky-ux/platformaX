/**
 * notifications-v2 — command + query input shapes.
 *
 * Public commands the service accepts. Outcomes (`CreateNotificationOutcome`)
 * discriminate "really created" vs "skipped because of dedupe / category /
 * actor==recipient" without falling back to errors — those are not failures.
 */
import type {
  NotificationCategory,
  NotificationDTO,
  NotificationListFilter,
  NotificationSourceDTO,
  NotificationType,
} from "./dto";

export interface CreateNotificationInput {
  recipientUserId: string;
  actorUserId: string | null;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  bodyPreview: string;
  source: NotificationSourceDTO;
  dedupeKey?: string | null;
  correlationId?: string | null;
}

export type CreateNotificationOutcome =
  | { created: true; notification: NotificationDTO }
  | {
      created: false;
      reason: "actor_is_recipient" | "category_disabled" | "duplicate";
    };

export interface ListNotificationsQuery {
  viewerUserId: string;
  filter?: NotificationListFilter;
  cursor?: string | null;
  limit?: number;
}

export interface MarkNotificationReadInput {
  viewerUserId: string;
  notificationId: string;
}

export interface MarkAllNotificationsReadInput {
  viewerUserId: string;
  category?: NotificationCategory;
}

export interface ArchiveNotificationInput {
  viewerUserId: string;
  notificationId: string;
}
