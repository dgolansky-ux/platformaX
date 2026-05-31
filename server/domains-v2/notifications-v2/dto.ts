/**
 * notifications-v2 — core DTOs (Slice 14 / BACKEND_PARTIAL).
 *
 * Privacy: Public DTO — carries actor / recipient user ids + source refs only.
 * No email, phone, raw post bodies or other PII. Inputs and settings shapes
 * live in `commands.ts` and `settings-dto.ts`.
 */

export type NotificationCategory =
  | "friend_feed"
  | "communities"
  | "channels"
  | "professional"
  | "modules"
  | "system";

export type NotificationStatus = "unread" | "read" | "archived";

export type NotificationDeliveryChannel = "in_app";

/**
 * Notification kinds the runtime understands. Each kind corresponds to one
 * entry in the event registry. Adding a kind here is a typed change so
 * notifications cannot be created for unknown product events.
 */
export type NotificationType =
  | "friend_post_comment"
  | "friend_post_reaction"
  | "friend_post_comment_reaction"
  | "community_invite"
  | "community_join_request"
  | "community_join_accepted"
  | "community_join_rejected"
  | "community_role_changed"
  | "channel_post"
  | "channel_lead_assigned"
  | "channel_lead_revoked"
  | "channel_post_comment"
  | "channel_post_reaction"
  | "newsletter_message"
  | "event_created"
  | "workplace_contact_request"
  | "system_announcement";

export interface NotificationSourceDTO {
  sourceDomain: string;
  sourceType: string;
  sourceId: string;
  routeTarget: string;
}

export interface NotificationRecord {
  id: string;
  recipientUserId: string;
  actorUserId: string | null;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  bodyPreview: string;
  source: NotificationSourceDTO;
  status: NotificationStatus;
  deliveryChannel: NotificationDeliveryChannel;
  dedupeKey: string | null;
  correlationId: string | null;
  createdAt: string;
  readAt: string | null;
  archivedAt: string | null;
}

export interface NotificationDTO {
  id: string;
  recipientUserId: string;
  actorUserId: string | null;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  bodyPreview: string;
  source: NotificationSourceDTO;
  status: NotificationStatus;
  deliveryChannel: NotificationDeliveryChannel;
  createdAt: string;
  readAt: string | null;
  archivedAt: string | null;
}

export interface NotificationListDTO {
  items: readonly NotificationDTO[];
  nextCursor: string | null;
}

export type NotificationListFilter =
  | { kind: "all" }
  | { kind: "unread" }
  | { kind: "category"; category: NotificationCategory };

export interface NotificationUnreadCountDTO {
  total: number;
  byCategory: Readonly<Record<NotificationCategory, number>>;
}
