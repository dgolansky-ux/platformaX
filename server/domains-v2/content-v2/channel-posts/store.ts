import type { ChannelPostRecord, ChannelPostRepository } from "./ports";

function orderPosts(a: ChannelPostRecord, b: ChannelPostRecord): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  if (a.createdAt !== b.createdAt) return a.createdAt > b.createdAt ? -1 : 1;
  return a.id > b.id ? -1 : a.id < b.id ? 1 : 0;
}

export function createInMemoryChannelPostRepository(): ChannelPostRepository {
  const rows = new Map<string, ChannelPostRecord>();
  return {
    async create(record) { rows.set(record.id, record); return record; },
    async getById(id) {
      const r = rows.get(id);
      return r && r.status !== "deactivated" ? r : null;
    },
    async update(record) { rows.set(record.id, record); return record; },
    async clearPinnedForChannel(channelId, exceptPostId) {
      for (const r of rows.values()) {
        if (r.channelId !== channelId || r.id === exceptPostId || !r.pinned) continue;
        rows.set(r.id, { ...r, pinned: false, pinnedAt: undefined, pinnedByUserId: undefined });
      }
    },
    async getPinnedForChannel(channelId) {
      return [...rows.values()].find((r) =>
        r.channelId === channelId && r.status !== "deactivated" && r.pinned
      ) ?? null;
    },
    async listForChannel(channelId, cursor, limit) {
      const all = [...rows.values()]
        .filter((r) => r.channelId === channelId && r.status !== "deactivated")
        .sort(orderPosts);
      const start = cursor ? all.findIndex((r) => r.id === cursor) + 1 : 0;
      return all.slice(start, start + limit);
    },
  };
}
