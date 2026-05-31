/**
 * content-v2 — in-memory post repository + friend-feed read model
 * (READ_MODEL_SKELETON). Single owner of the feed read path: this module.
 * A DB adapter will implement the same port later. No global feed: queries
 * are always scoped to an explicit set of author ids.
 */
import type { PostRecord, PostRepository } from "./ports";

export function createInMemoryPostRepository(): PostRepository {
  const rows = new Map<string, PostRecord>();
  return {
    async create(record) {
      rows.set(record.id, record);
      return record;
    },
    async getById(id) {
      const r = rows.get(id);
      return r && r.status === "active" ? r : null;
    },
    async listByAuthors(authorUserIds, cursor, limit) {
      const allow = new Set(authorUserIds);
      const all = [...rows.values()]
        .filter((r) => r.status === "active" && allow.has(r.authorUserId))
        // newest-first, stable tie-breaker on id
        .sort((a, b) =>
          a.createdAt === b.createdAt
            ? (a.id < b.id ? 1 : -1)
            : a.createdAt < b.createdAt
              ? 1
              : -1,
        );
      const start = cursor ? all.findIndex((r) => r.id === cursor) + 1 : 0;
      return all.slice(start, start + limit);
    },
  };
}
