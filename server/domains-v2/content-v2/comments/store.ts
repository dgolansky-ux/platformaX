/**
 * content-v2 / comments — in-memory adapter (READ_MODEL_SKELETON). DB adapter
 * implements the same ports later. Read path scoped to one feed item; no
 * global query — thread order is chronological (oldest first) with a stable id
 * tie-breaker.
 */
import type { CommentRecord, CommentRepository } from "./ports";

function oldestFirst(a: CommentRecord, b: CommentRecord): number {
  if (a.createdAt === b.createdAt) return a.id < b.id ? -1 : 1;
  return a.createdAt < b.createdAt ? -1 : 1;
}

export function createInMemoryCommentRepository(): CommentRepository {
  const rows = new Map<string, CommentRecord>();
  return {
    async create(record) {
      rows.set(record.id, record);
      return record;
    },
    async getById(id) {
      return rows.get(id) ?? null;
    },
    async list(feedItemId, cursor, limit) {
      const all = [...rows.values()].filter((r) => r.feedItemId === feedItemId).sort(oldestFirst);
      const start = cursor ? all.findIndex((r) => r.id === cursor) + 1 : 0;
      return all.slice(start, start + limit);
    },
    async countActive(feedItemId) {
      let n = 0;
      for (const r of rows.values()) {
        if (r.feedItemId === feedItemId && r.status === "active") n += 1;
      }
      return n;
    },
    async countActiveBatch(feedItemIds) {
      // SCALABILITY_EXCEPTION: bounded by caller (UI page = ≤50 items); a DB
      // adapter replaces this with a single GROUP BY feed_item_id.
      const out = new Map<string, number>();
      for (const id of feedItemIds) out.set(id, 0);
      for (const r of rows.values()) {
        if (r.status !== "active") continue;
        if (out.has(r.feedItemId)) out.set(r.feedItemId, (out.get(r.feedItemId) as number) + 1);
      }
      return out;
    },
    async update(id, patch) {
      const cur = rows.get(id);
      if (!cur) return null;
      const next: CommentRecord = { ...cur, body: patch.body, updatedAt: patch.updatedAt };
      rows.set(id, next);
      return next;
    },
    async softDelete(id, deletedAt) {
      const cur = rows.get(id);
      if (!cur) return null;
      const next: CommentRecord = { ...cur, status: "deleted", deletedAt, updatedAt: deletedAt };
      rows.set(id, next);
      return next;
    },
  };
}
