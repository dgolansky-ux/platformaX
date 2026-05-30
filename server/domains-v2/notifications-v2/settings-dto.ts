/**
 * notifications-v2 — settings DTOs (per-user, per-category, in-app only).
 *
 * Privacy: Public DTO — user id + category + bool toggle. Settings act as a
 * creation gate: a disabled category does NOT delete existing notifications,
 * it only prevents new ones from being created.
 */
import type { NotificationCategory } from "./dto";

export interface NotificationSettingRecord {
  userId: string;
  category: NotificationCategory;
  inAppEnabled: boolean;
  updatedAt: string;
}

export interface NotificationCategorySettingDTO {
  category: NotificationCategory;
  inAppEnabled: boolean;
  updatedAt: string;
}

export interface NotificationSettingsDTO {
  userId: string;
  categories: readonly NotificationCategorySettingDTO[];
}

export interface UpdateNotificationSettingsInput {
  viewerUserId: string;
  category: NotificationCategory;
  inAppEnabled: boolean;
}
