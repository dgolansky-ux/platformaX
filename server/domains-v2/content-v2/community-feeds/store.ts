/**
 * content-v2 / community-feeds — in-memory adapters (READ_MODEL_SKELETON). A DB
 * adapter implements the same ports later. The feed item read path is the sole
 * owner here; queries are always scoped to (communityId, feedType) — no global
 * feed. dedupeKey enforces idempotent distribution.
 */
import type { CommunityFeedType } from "./dto";
import type {
  CommunityFeedItemRecord,
  CommunityFeedItemRepository,
  CommunityPostRecord,
  CommunityPostRepository,
} from "./ports";

export function createInMemoryCommunityPostRepository(): CommunityPostRepository {
  const rows = new Map<string, CommunityPostRecord>();
  return {
    async create(record) {
      rows.set(record.id, record);
      return record;
    },
    async getById(id) {
      const r = rows.get(id);
      return r && r.status === "published" ? r : null;
    },
  };
}

function newestFirst(a: CommunityFeedItemRecord, b: CommunityFeedItemRecord): number {
  if (a.createdAt === b.createdAt) return a.id < b.id ? 1 : -1;
  return a.createdAt < b.createdAt ? 1 : -1;
}

export function createInMemoryCommunityFeedItemRepository(): CommunityFeedItemRepository {
  const rows = new Map<string, CommunityFeedItemRecord>();
  const dedupe = new Set<string>();
  return {
    async add(record) {
      if (dedupe.has(record.dedupeKey)) return null;
      dedupe.add(record.dedupeKey);
      rows.set(record.id, record);
      return record;
    },
    async list(communityId: string, feedType: CommunityFeedType, cursor: string | null, limit: number) {
      const all = [...rows.values()]
        .filter((r) => r.status === "active" && r.communityId === communityId && r.feedType === feedType)
        .sort(newestFirst);
      const start = cursor ? all.findIndex((r) => r.id === cursor) + 1 : 0;
      return all.slice(start, start + limit);
    },
    async countRelationalForAuthorMonth(communityId: string, authorUserId: string, monthKey: string) {
      // SCALABILITY_EXCEPTION: bounded count for one (community, author, month);
      // a DB adapter replaces this with COUNT(*) ... WHERE month_key = $1.
      return [...rows.values()].filter(
        (r) =>
          r.status === "active" &&
          r.feedType === "relational" &&
          r.communityId === communityId &&
          r.authorUserId === authorUserId &&
          r.createdAt.slice(0, 7) === monthKey,
      ).length;
    },
  };
}
