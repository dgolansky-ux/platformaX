/**
 * notifications-v2 — cross-domain contracts.
 *
 * Other domains and the application layer depend on these types when mapping
 * product events to notification creates. notifications-v2 NEVER imports
 * other domains' internals — application-v2 wires this contract.
 */

import type {
  NotificationCategory,
  NotificationType,
} from "./dto";

export type { NotificationCategory, NotificationType };

/**
 * Lightweight summary the application layer should pass for the actor of a
 * notification. Notifications-v2 stores `actorUserId` only; the UI resolves
 * the actor name/avatar through identity's public profile at render time.
 * No PII (no email/phone) is ever passed in this contract.
 */
export interface NotificationActorRef {
  actorUserId: string;
}

/**
 * Describes the source entity that triggered a notification. Notifications-v2
 * does NOT store any of the source content; it stores a reference + a route
 * target the UI can navigate to.
 */
export interface NotificationSourceRef {
  sourceDomain: string;
  sourceType: string;
  sourceId: string;
  routeTarget: string;
}

export type NotificationEventHandlerStatus =
  | "implemented"
  | "planned"
  | "no_notification_needed"
  | "blocked_by_missing_source_event";
