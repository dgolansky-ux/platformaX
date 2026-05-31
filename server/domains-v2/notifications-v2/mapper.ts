/**
 * notifications-v2 — record → public DTO.
 *
 * dedupeKey and correlationId stay internal (never on the public DTO); the
 * domain uses them for idempotency and correlation only. Public DTO is shaped
 * for the in-app Activity Center.
 */
import { NOTIFICATION_CATEGORIES } from "./constants";
import type {
  NotificationDTO,
  NotificationRecord,
  NotificationUnreadCountDTO,
} from "./dto";
import type {
  NotificationCategorySettingDTO,
  NotificationSettingRecord,
  NotificationSettingsDTO,
} from "./settings-dto";

export function toNotificationDTO(record: NotificationRecord): NotificationDTO {
  return {
    id: record.id,
    recipientUserId: record.recipientUserId,
    actorUserId: record.actorUserId,
    type: record.type,
    category: record.category,
    title: record.title,
    bodyPreview: record.bodyPreview,
    source: record.source,
    status: record.status,
    deliveryChannel: record.deliveryChannel,
    createdAt: record.createdAt,
    readAt: record.readAt,
    archivedAt: record.archivedAt,
  };
}

export function toUnreadCountDTO(
  byCategory: Readonly<Record<NotificationDTO["category"], number>>,
): NotificationUnreadCountDTO {
  let total = 0;
  for (const c of NOTIFICATION_CATEGORIES) total += byCategory[c];
  return { total, byCategory };
}

export function toSettingsDTO(
  userId: string,
  records: readonly NotificationSettingRecord[],
  now: string,
): NotificationSettingsDTO {
  const byCategory = new Map<NotificationSettingRecord["category"], NotificationSettingRecord>();
  for (const r of records) byCategory.set(r.category, r);
  const categories: NotificationCategorySettingDTO[] = NOTIFICATION_CATEGORIES.map((category) => {
    const existing = byCategory.get(category);
    if (existing) {
      return {
        category,
        inAppEnabled: existing.inAppEnabled,
        updatedAt: existing.updatedAt,
      };
    }
    return { category, inAppEnabled: true, updatedAt: now };
  });
  return { userId, categories };
}
