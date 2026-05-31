/**
 * notifications-v2 — service-internal helpers.
 *
 * Pulled out of `service.ts` to keep that file focused on orchestration; this
 * file owns purely-internal utility shapes (Result, fail, limit clamping,
 * filter translation, category-gate lookup).
 */
import {
  NOTIFICATIONS_DEFAULT_LIMIT,
  NOTIFICATIONS_MAX_LIMIT,
} from "./constants";
import type { NotificationCategory, NotificationListFilter } from "./dto";
import type {
  NotificationRepositoryListFilter,
  NotificationSettingsRepository,
} from "./ports";

export type NotificationsErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "VALIDATION_FAILED";

export type NotificationsResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: NotificationsErrorCode; message: string } };

export type NotificationsClock = { now: () => Date };
export type NotificationsIdGen = { next: () => string };

export function fail<T>(code: NotificationsErrorCode, message: string): NotificationsResult<T> {
  return { ok: false, error: { code, message } };
}

export function clampLimit(requested: number | undefined): number {
  const n = requested && requested > 0 ? requested : NOTIFICATIONS_DEFAULT_LIMIT;
  return Math.min(n, NOTIFICATIONS_MAX_LIMIT);
}

export function toRepoFilter(filter: NotificationListFilter | undefined): NotificationRepositoryListFilter {
  if (!filter || filter.kind === "all") return { kind: "all" };
  if (filter.kind === "unread") return { kind: "unread" };
  return { kind: "category", category: filter.category };
}

export async function categoryEnabled(
  settings: NotificationSettingsRepository,
  userId: string,
  category: NotificationCategory,
): Promise<boolean> {
  const existing = await settings.getForCategory(userId, category);
  if (!existing) return true;
  return existing.inAppEnabled;
}
