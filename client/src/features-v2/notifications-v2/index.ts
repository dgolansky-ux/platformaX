/**
 * features-v2/notifications-v2 — UI feature barrel.
 *
 * Status: UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 */
export { NotificationsPage } from "./NotificationsPage";
export { NotificationCard } from "./NotificationCard";
export { NotificationsFilterTabs } from "./NotificationsFilterTabs";
export { NotificationSettingsPanel } from "./NotificationSettingsPanel";
export { useNotificationsUnreadCount } from "./useNotificationsUnreadCount";
export { notificationsMockAdapter } from "./mock-adapter";
export type {
  NotificationCategoryUi,
  NotificationListFilterUi,
  NotificationListUi,
  NotificationSettingsUi,
  NotificationStatusUi,
  NotificationTypeUi,
  NotificationUi,
  NotificationUnreadCountUi,
} from "./types";
