/**
 * notifications-v2 — pure policy + validation. No IO.
 *
 * Rules:
 * - notification belongs to exactly one recipient,
 * - viewer can read / mark / archive only their own notifications,
 * - title and bodyPreview are length-bounded and have no PII delivery — the
 *   PII guard runs at the public-DTO scan level (`check-public-dto-pii.mjs`);
 *   this module enforces shape only.
 */
import {
  NOTIFICATION_BODY_PREVIEW_MAX,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TITLE_MAX,
} from "./constants";
import type {
  NotificationCategory,
  NotificationRecord,
  NotificationType,
} from "./dto";

export type NotificationValidationError =
  | "TITLE_REQUIRED"
  | "TITLE_TOO_LONG"
  | "BODY_PREVIEW_REQUIRED"
  | "BODY_PREVIEW_TOO_LONG"
  | "CATEGORY_INVALID"
  | "TYPE_INVALID"
  | "RECIPIENT_REQUIRED"
  | "SOURCE_REQUIRED"
  | "ROUTE_TARGET_INVALID";

const NOTIFICATION_TYPES: readonly NotificationType[] = [
  "friend_post_comment",
  "friend_post_reaction",
  "friend_post_comment_reaction",
  "community_invite",
  "community_join_request",
  "community_join_accepted",
  "community_join_rejected",
  "community_role_changed",
  "channel_post",
  "channel_lead_assigned",
  "channel_lead_revoked",
  "channel_post_comment",
  "channel_post_reaction",
  "newsletter_message",
  "event_created",
  "workplace_contact_request",
  "system_announcement",
];

export function isNotificationCategory(v: string): v is NotificationCategory {
  return (NOTIFICATION_CATEGORIES as readonly string[]).includes(v);
}

export function isNotificationType(v: string): v is NotificationType {
  return (NOTIFICATION_TYPES as readonly string[]).includes(v);
}

export function validateTitle(title: string): NotificationValidationError | null {
  const trimmed = title.trim();
  if (trimmed.length === 0) return "TITLE_REQUIRED";
  if (trimmed.length > NOTIFICATION_TITLE_MAX) return "TITLE_TOO_LONG";
  return null;
}

export function validateBodyPreview(body: string): NotificationValidationError | null {
  const trimmed = body.trim();
  if (trimmed.length === 0) return "BODY_PREVIEW_REQUIRED";
  if (trimmed.length > NOTIFICATION_BODY_PREVIEW_MAX) return "BODY_PREVIEW_TOO_LONG";
  return null;
}

export function validateRouteTarget(route: string): NotificationValidationError | null {
  const trimmed = route.trim();
  if (trimmed.length === 0) return "ROUTE_TARGET_INVALID";
  if (!trimmed.startsWith("/")) return "ROUTE_TARGET_INVALID";
  return null;
}

export function canViewNotification(
  record: Pick<NotificationRecord, "recipientUserId">,
  viewerUserId: string,
): boolean {
  return record.recipientUserId === viewerUserId;
}
