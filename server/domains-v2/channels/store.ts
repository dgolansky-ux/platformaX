/**
 * channels — in-memory repository adapters (BACKEND_PARTIAL).
 *
 * Constraints enforced here:
 *   - unique (ownerId, slug) for channels,
 *   - unique (channelId, userId) for active leads,
 *   - unique (channelId, followerUserId) for follows.
 *
 * Stable order for lists: by id ascending — a DB adapter replaces this with a
 * proper (created_at DESC, id) cursor.
 */
import type {
  ChannelLeadPermission,
  ChannelLeadStatus,
} from "./contracts";
import type {
  ChannelVisibility,
} from "./dto";
import type {
  ChannelLeadRecord,
  ChannelLeadRepository,
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
    async listAllActive(cursor, limit) {
      const all = [...rows.values()]
        .filter((r) => r.status === "active")
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      const start = cursor ? all.findIndex((r) => r.id === cursor) + 1 : 0;
      return all.slice(start, start + limit);
    },
    async update(id, patch) {
      const cur = rows.get(id);
      if (!cur) return null;
      const next: ChannelRecord = {
        ...cur,
        name: patch.name ?? cur.name,
        description: patch.description ?? cur.description,
        visibility: (patch.visibility ?? cur.visibility) as ChannelVisibility,
        updatedAt: patch.updatedAt,
      };
      rows.set(id, next);
      return next;
    },
    async archive(id, updatedAt) {
      const cur = rows.get(id);
      if (!cur) return null;
      const next: ChannelRecord = { ...cur, status: "archived", updatedAt };
      rows.set(id, next);
      return next;
    },
  };
}

export function createInMemoryChannelLeadRepository(): ChannelLeadRepository {
  const rows = new Map<string, ChannelLeadRecord>();
  const k = (channelId: string, userId: string) => `${channelId}|${userId}`;
  return {
    async upsert(record) {
      const existing = rows.get(k(record.channelId, record.userId));
      if (existing && existing.status === "active") {
        return { record: existing, created: false };
      }
      rows.set(k(record.channelId, record.userId), record);
      return { record, created: true };
    },
    async revoke(channelId, userId, updatedAt) {
      const cur = rows.get(k(channelId, userId));
      if (!cur || cur.status !== "active") return false;
      const next: ChannelLeadRecord = {
        ...cur,
        status: "revoked" as ChannelLeadStatus,
        assignedAt: updatedAt,
      };
      rows.set(k(channelId, userId), next);
      return true;
    },
    async updatePermissions(channelId, userId, permissions) {
      const cur = rows.get(k(channelId, userId));
      if (!cur || cur.status !== "active") return null;
      const dedup = [...new Set(permissions)] as ChannelLeadPermission[];
      const next: ChannelLeadRecord = { ...cur, permissions: dedup };
      rows.set(k(channelId, userId), next);
      return next;
    },
    async findActive(channelId, userId) {
      const cur = rows.get(k(channelId, userId));
      return cur && cur.status === "active" ? cur : null;
    },
    async listActiveForChannel(channelId) {
      return [...rows.values()]
        .filter((r) => r.channelId === channelId && r.status === "active")
        .sort((a, b) => (a.assignedAt < b.assignedAt ? -1 : a.assignedAt > b.assignedAt ? 1 : a.userId < b.userId ? -1 : 1));
    },
    async countActiveForChannel(channelId) {
      let n = 0;
      for (const r of rows.values()) if (r.channelId === channelId && r.status === "active") n += 1;
      return n;
    },
    async listChannelsLedByUser(userId) {
      return [...rows.values()].filter((r) => r.userId === userId && r.status === "active");
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
      let n = 0;
      for (const r of rows.values()) if (r.channelId === channelId && r.status === "active") n += 1;
      return n;
    },
    async listActiveForUser(userId) {
      return [...rows.values()].filter((r) => r.followerUserId === userId && r.status === "active");
    },
  };
}
