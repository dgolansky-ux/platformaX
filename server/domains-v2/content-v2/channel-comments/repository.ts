import type { ChannelCommentStatus } from "./dto";

export type ChannelCommentRecord = {
  id: string;
  channelPostId: string;
  parentCommentId: string | null;
  authorUserId: string;
  body: string;
  status: ChannelCommentStatus;
  moderationReason?: string;
  moderatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export interface ChannelCommentRepository {
  create(record: ChannelCommentRecord): Promise<ChannelCommentRecord>;
  getById(id: string): Promise<ChannelCommentRecord | null>;
  list(channelPostId: string, cursor: string | null, limit: number): Promise<ChannelCommentRecord[]>;
  update(record: ChannelCommentRecord): Promise<ChannelCommentRecord>;
  countActive(channelPostId: string): Promise<number>;
  countActiveBatch(channelPostIds: readonly string[]): Promise<Map<string, number>>;
}

function oldestFirst(a: ChannelCommentRecord, b: ChannelCommentRecord): number {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function createInMemoryChannelCommentRepository(): ChannelCommentRepository {
  const rows = new Map<string, ChannelCommentRecord>();
  return {
    async create(record) {
      rows.set(record.id, record);
      return record;
    },
    async getById(id) {
      return rows.get(id) ?? null;
    },
    async list(channelPostId, cursor, limit) {
      const all = [...rows.values()].filter((r) => r.channelPostId === channelPostId).sort(oldestFirst);
      const start = cursor ? all.findIndex((r) => r.id === cursor) + 1 : 0;
      return all.slice(start, start + limit);
    },
    async update(record) {
      rows.set(record.id, record);
      return record;
    },
    async countActive(channelPostId) {
      let count = 0;
      for (const r of rows.values()) {
        if (r.channelPostId === channelPostId && r.status !== "deactivated") count += 1;
      }
      return count;
    },
    async countActiveBatch(channelPostIds) {
      const out = new Map<string, number>();
      for (const id of channelPostIds) out.set(id, 0);
      for (const r of rows.values()) {
        if (r.status === "deactivated" || !out.has(r.channelPostId)) continue;
        out.set(r.channelPostId, (out.get(r.channelPostId) ?? 0) + 1);
      }
      return out;
    },
  };
}
