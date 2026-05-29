/**
 * channels — in-memory repository adapters (BACKEND_PARTIAL). Unique
 * (ownerId, slug) for channels; unique (channelId, followerUserId) for follows.
 */
import type {
  ChannelRecord,
  ChannelRepository,
  FollowRecord,
  FollowRepository,
} from "./ports";

export function createInMemoryChannelRepository(): ChannelRepository {
  const rows = new Map<string, ChannelRecord>();
  const ownerSlug = new Map<string, string>();
  const k = (ownerId: string, slug: string) => `${ownerId}|${slug}`;
  return {
    async create(record) {
      rows.set(record.id, record);
      ownerSlug.set(k(record.ownerId, record.slug), record.id);
      return record;
    },
    async getById(id) {
      const r = rows.get(id);
      return r && r.status !== "deleted" ? r : null;
    },
    async findByOwnerSlug(ownerId, slug) {
      const id = ownerSlug.get(k(ownerId, slug));
      return id ? (rows.get(id) ?? null) : null;
    },
    async listForOwner(ownerId, cursor, limit) {
      const all = [...rows.values()]
        .filter((r) => r.ownerId === ownerId && r.status !== "deleted")
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      const start = cursor ? all.findIndex((r) => r.id === cursor) + 1 : 0;
      return all.slice(start, start + limit);
    },
  };
}

export function createInMemoryFollowRepository(): FollowRepository {
  const rows = new Map<string, FollowRecord>();
  const k = (c: string, u: string) => `${c}|${u}`;
  return {
    async upsert(record) {
      rows.set(k(record.channelId, record.followerUserId), record);
    },
    async get(channelId, followerUserId) {
      return rows.get(k(channelId, followerUserId)) ?? null;
    },
    async countActive(channelId) {
      return [...rows.values()].filter((r) => r.channelId === channelId && r.status === "active").length;
    },
  };
}
