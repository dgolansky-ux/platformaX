/**
 * features-v2/notifications-v2 — UI types.
 *
 * Mirrors the notifications-v2 public DTO shape so the frontend never imports
 * `@server/*`. Adapter results follow the standard `{ok, value/error}` shape
 * the rest of the V2 features use.
 */

export type NotificationCategoryUi =
  | "friend_feed"
  | "communities"
  | "channels"
  | "professional"
  | "modules"
  | "system";

export type NotificationStatusUi = "unread" | "read" | "archived";

export type NotificationTypeUi =
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

export interface NotificationSourceUi {
  sourceDomain: string;
  sourceType: string;
  sourceId: string;
  routeTarget: string;
}

export interface NotificationUi {
  id: string;
  recipientUserId: string;
  actorUserId: string | null;
  type: NotificationTypeUi;
  category: NotificationCategoryUi;
  title: string;
  bodyPreview: string;
  source: NotificationSourceUi;
  status: NotificationStatusUi;
  createdAt: string;
  readAt: string | null;
  archivedAt: string | null;
}

export interface NotificationListUi {
  items: readonly NotificationUi[];
  nextCursor: string | null;
}

export interface NotificationUnreadCountUi {
  total: number;
  byCategory: Readonly<Record<NotificationCategoryUi, number>>;
}

export type NotificationListFilterUi =
  | { kind: "all" }
  | { kind: "unread" }
  | { kind: "category"; category: NotificationCategoryUi };

export interface NotificationCategorySettingUi {
  category: NotificationCategoryUi;
  inAppEnabled: boolean;
  updatedAt: string;
}

export interface NotificationSettingsUi {
  userId: string;
  categories: readonly NotificationCategorySettingUi[];
}

export type NotificationsAdapterResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_FAILED" | "ADAPTER_FAILURE"; message: string } };
