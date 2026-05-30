/**
 * notifications-v2 — settings handlers (getSettings / updateSettings).
 *
 * Kept separate from `service.ts` so the notifications-side stays focused on
 * the notification lifecycle while the settings foundation owns its own file.
 */
import type { NotificationsClock } from "./service";
import type { NotificationSettingsRepository } from "./ports";
import type {
  NotificationSettingsDTO,
  UpdateNotificationSettingsInput,
} from "./settings-dto";
import { toSettingsDTO } from "./mapper";
import { isNotificationCategory } from "./policy";
import { fail, type NotificationsResult } from "./service-helpers";

export async function getSettingsForViewer(
  settings: NotificationSettingsRepository,
  clock: NotificationsClock,
  viewerUserId: string,
): Promise<NotificationsResult<NotificationSettingsDTO>> {
  if (viewerUserId.trim().length === 0) return fail("FORBIDDEN", "VIEWER_REQUIRED");
  const records = await settings.getForUser(viewerUserId);
  return { ok: true, value: toSettingsDTO(viewerUserId, records, clock.now().toISOString()) };
}

export async function updateSettingsForViewer(
  settings: NotificationSettingsRepository,
  clock: NotificationsClock,
  input: UpdateNotificationSettingsInput,
): Promise<NotificationsResult<NotificationSettingsDTO>> {
  if (input.viewerUserId.trim().length === 0) return fail("FORBIDDEN", "VIEWER_REQUIRED");
  if (!isNotificationCategory(input.category)) return fail("VALIDATION_FAILED", "CATEGORY_INVALID");
  const now = clock.now().toISOString();
  await settings.upsert({
    userId: input.viewerUserId,
    category: input.category,
    inAppEnabled: input.inAppEnabled,
    updatedAt: now,
  });
  const records = await settings.getForUser(input.viewerUserId);
  return { ok: true, value: toSettingsDTO(input.viewerUserId, records, now) };
}
