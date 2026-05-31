/**
 * notifications-v2 — public constants (category list + bounded limits).
 */
import type { NotificationCategory } from "./dto";

export const NOTIFICATION_CATEGORIES: readonly NotificationCategory[] = [
  "friend_feed",
  "communities",
  "channels",
  "professional",
  "modules",
  "system",
];

export const NOTIFICATIONS_DEFAULT_LIMIT = 25;
export const NOTIFICATIONS_MAX_LIMIT = 100;
export const NOTIFICATION_TITLE_MAX = 140;
export const NOTIFICATION_BODY_PREVIEW_MAX = 240;
