/**
 * notifications-v2 — in-memory repositories.
 *
 * SCALABILITY_HOT_PATH_EXCEPTION: list returns stable order (createdAt desc +
 * id tie-break) with cursor + bounded limit. Durable adapter pending; the
 * Slice-14 report ships the migration draft for the Postgres backing.
 */
import { NOTIFICATION_CATEGORIES } from "./constants";
import type { NotificationCategory, NotificationRecord } from "./dto";
import type { NotificationSettingRecord } from "./settings-dto";
import type {
  NotificationRepository,
  NotificationRepositoryListFilter,
  NotificationSettingsRepository,
} from "./ports";

function emptyCounts(): Record<NotificationCategory, number> {
  const counts: Record<NotificationCategory, number> = {
    friend_feed: 0,
    communities: 0,
    channels: 0,
    professional: 0,
    modules: 0,
    system: 0,
  };
  return counts;
}

function notificationSort(a: NotificationRecord, b: NotificationRecord): number {
  if (a.createdAt === b.createdAt) return a.id < b.id ? 1 : -1;
  return a.createdAt < b.createdAt ? 1 : -1;
}

function matchesFilter(
  record: NotificationRecord,
  filter: NotificationRepositoryListFilter,
): boolean {
  if (filter.kind === "all") return record.status !== "archived";
  if (filter.kind === "unread") return record.status === "unread";
  return record.category === filter.category && record.status !== "archived";
}

export function createInMemoryNotificationRepository(): NotificationRepository {
  const rows = new Map<string, NotificationRecord>();
  const dedupe = new Map<string, string>();

  function dedupeIndex(recipient: string, key: string): string {
    return `${recipient}|${key}`;
  }

  return {
    async insert(record) {
      rows.set(record.id, record);
      if (record.dedupeKey) {
        dedupe.set(dedupeIndex(record.recipientUserId, record.dedupeKey), record.id);
      }
    },
    async update(record) {
      rows.set(record.id, record);
    },
    async getById(id) {
      return rows.get(id) ?? null;
    },
    async listForViewer(viewerUserId, filter, cursor, limit) {
      const sorted = [...rows.values()]
        .filter((r) => r.recipientUserId === viewerUserId && matchesFilter(r, filter))
        .sort(notificationSort);
      const start = cursor ? sorted.findIndex((r) => r.id === cursor) + 1 : 0;
      return sorted.slice(start, start + limit);
    },
    async countUnreadByCategory(viewerUserId) {
      const counts = emptyCounts();
      for (const r of rows.values()) {
        if (r.recipientUserId !== viewerUserId) continue;
        if (r.status !== "unread") continue;
        counts[r.category] += 1;
      }
      return counts;
    },
    async findByDedupeKey(recipientUserId, dedupeKey) {
      const id = dedupe.get(dedupeIndex(recipientUserId, dedupeKey));
      if (!id) return null;
      return rows.get(id) ?? null;
    },
    async markAllReadForViewer(viewerUserId, category, now) {
      let count = 0;
      for (const r of rows.values()) {
        if (r.recipientUserId !== viewerUserId) continue;
        if (r.status !== "unread") continue;
        if (category && r.category !== category) continue;
        rows.set(r.id, { ...r, status: "read", readAt: now });
        count += 1;
      }
      return count;
    },
  };
}

export function createInMemoryNotificationSettingsRepository(): NotificationSettingsRepository {
  const rows = new Map<string, NotificationSettingRecord>();

  function key(userId: string, category: NotificationCategory): string {
    return `${userId}|${category}`;
  }

  return {
    async upsert(record) {
      rows.set(key(record.userId, record.category), record);
    },
    async getForUser(userId) {
      const out: NotificationSettingRecord[] = [];
      for (const category of NOTIFICATION_CATEGORIES) {
        const existing = rows.get(key(userId, category));
        if (existing) out.push(existing);
      }
      return out;
    },
    async getForCategory(userId, category) {
      return rows.get(key(userId, category)) ?? null;
    },
  };
}
