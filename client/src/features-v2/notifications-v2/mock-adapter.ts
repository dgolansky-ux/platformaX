/**
 * features-v2/notifications-v2 — MOCK_LOCAL_ONLY transport.
 *
 * In-memory adapter that mirrors the notifications-v2 service contract so the
 * UI can demonstrate the Activity Center end-to-end without `@server/*` or
 * localStorage. Seeds a small, realistic notification set for the demo
 * viewer; settings default to all-categories-enabled in-app.
 *
 * Subscribers (e.g. the unread badge in the sidebar) can listen via
 * `subscribe(cb)` so changes from one place (mark-read on the page) propagate
 * to the badge without prop drilling.
 */
import type {
  NotificationCategoryUi,
  NotificationListFilterUi,
  NotificationListUi,
  NotificationSettingsUi,
  NotificationStatusUi,
  NotificationTypeUi,
  NotificationUi,
  NotificationUnreadCountUi,
  NotificationsAdapterResult,
} from "./types";

const CATEGORIES: readonly NotificationCategoryUi[] = [
  "friend_feed",
  "communities",
  "channels",
  "professional",
  "modules",
  "system",
];

interface NotificationRow {
  id: string;
  recipientUserId: string;
  actorUserId: string | null;
  type: NotificationTypeUi;
  category: NotificationCategoryUi;
  title: string;
  bodyPreview: string;
  sourceDomain: string;
  sourceType: string;
  sourceId: string;
  routeTarget: string;
  status: NotificationStatusUi;
  createdAt: string;
  readAt: string | null;
  archivedAt: string | null;
}

interface SettingRow {
  userId: string;
  category: NotificationCategoryUi;
  inAppEnabled: boolean;
  updatedAt: string;
}

let rowSeq = 100;
const rows = new Map<string, NotificationRow>();
const settings = new Map<string, SettingRow>();
const listeners = new Set<() => void>();

function key(userId: string, category: NotificationCategoryUi): string {
  return `${userId}|${category}`;
}

function emit(): void {
  for (const cb of listeners) cb();
}

function toUi(row: NotificationRow): NotificationUi {
  return {
    id: row.id,
    recipientUserId: row.recipientUserId,
    actorUserId: row.actorUserId,
    type: row.type,
    category: row.category,
    title: row.title,
    bodyPreview: row.bodyPreview,
    source: {
      sourceDomain: row.sourceDomain,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      routeTarget: row.routeTarget,
    },
    status: row.status,
    createdAt: row.createdAt,
    readAt: row.readAt,
    archivedAt: row.archivedAt,
  };
}

function seed(): void {
  if (rows.size > 0) return;
  const baseTime = Date.parse("2026-05-30T08:00:00Z");
  const sample: Array<Omit<NotificationRow, "id" | "createdAt" | "readAt" | "archivedAt" | "status">> = [
    {
      recipientUserId: "u-viewer",
      actorUserId: "u-ada",
      type: "friend_post_comment",
      category: "friend_feed",
      title: "Ada skomentowała Twój wpis",
      bodyPreview: "Sprawdź, co ma do powiedzenia.",
      sourceDomain: "content-v2/friend-posts",
      sourceType: "FriendFeedComment",
      sourceId: "fpc-1",
      routeTarget: "/friends-feed?postId=fp-3#comment-fpc-1",
    },
    {
      recipientUserId: "u-viewer",
      actorUserId: "u-kuba",
      type: "friend_post_reaction",
      category: "friend_feed",
      title: "Kuba polubił Twój wpis",
      bodyPreview: "Twój wpis ma nową reakcję.",
      sourceDomain: "content-v2/friend-posts",
      sourceType: "FriendFeedReaction",
      sourceId: "fp-3",
      routeTarget: "/friends-feed?postId=fp-3",
    },
    {
      recipientUserId: "u-viewer",
      actorUserId: "u-moderator",
      type: "community_invite",
      category: "communities",
      title: "Zaproszenie do społeczności",
      bodyPreview: "Otrzymałeś zaproszenie do społeczności Demo.",
      sourceDomain: "communities-v2",
      sourceType: "CommunityInvite",
      sourceId: "ci-1",
      routeTarget: "/communities/demo",
    },
    {
      recipientUserId: "u-viewer",
      actorUserId: "u-ada",
      type: "channel_post",
      category: "channels",
      title: "Nowy post na kanale",
      bodyPreview: "Kanał, który obserwujesz, ma nową aktualizację.",
      sourceDomain: "channels",
      sourceType: "ChannelPost",
      sourceId: "cp-1",
      routeTarget: "/channels/demo",
    },
    {
      recipientUserId: "u-viewer",
      actorUserId: null,
      type: "system_announcement",
      category: "system",
      title: "Witamy w Centrum aktywności",
      bodyPreview: "Tu zobaczysz aktywności znajomych, społeczności i kanałów.",
      sourceDomain: "system",
      sourceType: "SystemAnnouncement",
      sourceId: "sys-welcome",
      routeTarget: "/notifications",
    },
  ];
  sample.forEach((row, idx) => {
    const id = `notif-${++rowSeq}`;
    const createdAt = new Date(baseTime + (sample.length - idx) * 60_000).toISOString();
    rows.set(id, { ...row, id, status: "unread", createdAt, readAt: null, archivedAt: null });
  });
}

seed();

function sorted(records: readonly NotificationRow[]): NotificationRow[] {
  return [...records].sort((a, b) => {
    if (a.createdAt === b.createdAt) return a.id < b.id ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

function applyFilter(row: NotificationRow, filter: NotificationListFilterUi): boolean {
  if (filter.kind === "all") return row.status !== "archived";
  if (filter.kind === "unread") return row.status === "unread";
  return row.category === filter.category && row.status !== "archived";
}

function defaultByCategory(): Record<NotificationCategoryUi, number> {
  return {
    friend_feed: 0,
    communities: 0,
    channels: 0,
    professional: 0,
    modules: 0,
    system: 0,
  };
}

export interface NotificationsMockAdapter {
  list(input: {
    viewerUserId: string;
    filter?: NotificationListFilterUi;
    cursor?: string | null;
    limit?: number;
  }): Promise<NotificationsAdapterResult<NotificationListUi>>;
  getUnreadCount(viewerUserId: string): Promise<NotificationsAdapterResult<NotificationUnreadCountUi>>;
  markRead(input: { viewerUserId: string; notificationId: string }): Promise<NotificationsAdapterResult<NotificationUi>>;
  markAllRead(input: { viewerUserId: string; category?: NotificationCategoryUi }): Promise<NotificationsAdapterResult<{ affected: number }>>;
  archive(input: { viewerUserId: string; notificationId: string }): Promise<NotificationsAdapterResult<NotificationUi>>;
  getSettings(viewerUserId: string): Promise<NotificationsAdapterResult<NotificationSettingsUi>>;
  updateSetting(input: { viewerUserId: string; category: NotificationCategoryUi; inAppEnabled: boolean }): Promise<NotificationsAdapterResult<NotificationSettingsUi>>;
  subscribe(cb: () => void): () => void;
}

function fail<T>(code: "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_FAILED" | "ADAPTER_FAILURE", message: string): NotificationsAdapterResult<T> {
  return { ok: false, error: { code, message } };
}

function buildSettings(userId: string): NotificationSettingsUi {
  const now = new Date().toISOString();
  return {
    userId,
    categories: CATEGORIES.map((category) => {
      const existing = settings.get(key(userId, category));
      if (existing) return { category, inAppEnabled: existing.inAppEnabled, updatedAt: existing.updatedAt };
      return { category, inAppEnabled: true, updatedAt: now };
    }),
  };
}

export const notificationsMockAdapter: NotificationsMockAdapter = {
  async list(input) {
    if (input.viewerUserId.trim().length === 0) return fail("FORBIDDEN", "viewer required");
    const filter: NotificationListFilterUi = input.filter ?? { kind: "all" };
    const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
    const ownRows = sorted([...rows.values()].filter((r) => r.recipientUserId === input.viewerUserId && applyFilter(r, filter)));
    const start = input.cursor ? ownRows.findIndex((r) => r.id === input.cursor) + 1 : 0;
    const page = ownRows.slice(start, start + limit);
    return {
      ok: true,
      value: {
        items: page.map(toUi),
        nextCursor: page.length === limit ? page[page.length - 1].id : null,
      },
    };
  },
  async getUnreadCount(viewerUserId) {
    if (viewerUserId.trim().length === 0) return fail("FORBIDDEN", "viewer required");
    const counts = defaultByCategory();
    let total = 0;
    for (const r of rows.values()) {
      if (r.recipientUserId !== viewerUserId) continue;
      if (r.status !== "unread") continue;
      counts[r.category] += 1;
      total += 1;
    }
    return { ok: true, value: { total, byCategory: counts } };
  },
  async markRead(input) {
    const row = rows.get(input.notificationId);
    if (!row) return fail("NOT_FOUND", "notification not found");
    if (row.recipientUserId !== input.viewerUserId) return fail("FORBIDDEN", "not your notification");
    if (row.status === "read" || row.status === "archived") return { ok: true, value: toUi(row) };
    const updated: NotificationRow = { ...row, status: "read", readAt: new Date().toISOString() };
    rows.set(row.id, updated);
    emit();
    return { ok: true, value: toUi(updated) };
  },
  async markAllRead(input) {
    if (input.viewerUserId.trim().length === 0) return fail("FORBIDDEN", "viewer required");
    let affected = 0;
    const now = new Date().toISOString();
    for (const row of rows.values()) {
      if (row.recipientUserId !== input.viewerUserId) continue;
      if (row.status !== "unread") continue;
      if (input.category && row.category !== input.category) continue;
      rows.set(row.id, { ...row, status: "read", readAt: now });
      affected += 1;
    }
    if (affected > 0) emit();
    return { ok: true, value: { affected } };
  },
  async archive(input) {
    const row = rows.get(input.notificationId);
    if (!row) return fail("NOT_FOUND", "notification not found");
    if (row.recipientUserId !== input.viewerUserId) return fail("FORBIDDEN", "not your notification");
    if (row.status === "archived") return { ok: true, value: toUi(row) };
    const now = new Date().toISOString();
    const updated: NotificationRow = {
      ...row,
      status: "archived",
      archivedAt: now,
      readAt: row.readAt ?? now,
    };
    rows.set(row.id, updated);
    emit();
    return { ok: true, value: toUi(updated) };
  },
  async getSettings(viewerUserId) {
    if (viewerUserId.trim().length === 0) return fail("FORBIDDEN", "viewer required");
    return { ok: true, value: buildSettings(viewerUserId) };
  },
  async updateSetting(input) {
    if (input.viewerUserId.trim().length === 0) return fail("FORBIDDEN", "viewer required");
    settings.set(key(input.viewerUserId, input.category), {
      userId: input.viewerUserId,
      category: input.category,
      inAppEnabled: input.inAppEnabled,
      updatedAt: new Date().toISOString(),
    });
    emit();
    return { ok: true, value: buildSettings(input.viewerUserId) };
  },
  subscribe(cb) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};

/**
 * Test-only reset hook — restores the seeded fixture so tests can run in
 * isolation. Only the feature's own `__tests__` import this.
 */
export function __resetNotificationsMockAdapterForTests(): void {
  rows.clear();
  settings.clear();
  rowSeq = 100;
  seed();
  emit();
}
