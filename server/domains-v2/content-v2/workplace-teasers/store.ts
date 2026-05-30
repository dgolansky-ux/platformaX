/**
 * content-v2/workplace-teasers — in-memory store (BACKEND_PARTIAL).
 *
 * SCALABILITY_HOT_PATH_EXCEPTION: stable order (createdAt desc + id) with
 * cursor + bounded limit; durable adapter pending.
 */
import type { WorkplaceTeaserRecord } from "./dto";
import type { WorkplaceTeaserRepository } from "./ports";

function teaserSort(a: WorkplaceTeaserRecord, b: WorkplaceTeaserRecord): number {
  if (a.createdAt === b.createdAt) return a.id < b.id ? 1 : -1;
  return a.createdAt < b.createdAt ? 1 : -1;
}

export function createInMemoryWorkplaceTeaserRepository(): WorkplaceTeaserRepository {
  const rows = new Map<string, WorkplaceTeaserRecord>();
  const byDedupe = new Map<string, string>();
  return {
    async insert(record) {
      if (byDedupe.has(record.dedupeKey)) {
        return { inserted: false };
      }
      rows.set(record.id, record);
      byDedupe.set(record.dedupeKey, record.id);
      return { inserted: true };
    },
    async getByDedupeKey(dedupeKey) {
      const id = byDedupe.get(dedupeKey);
      if (!id) return null;
      return rows.get(id) ?? null;
    },
    async listForOwners(ownerUserIds, cursor, limit) {
      const allowed = new Set(ownerUserIds);
      const all = [...rows.values()]
        .filter((r) => allowed.has(r.ownerUserId))
        .sort(teaserSort);
      const start = cursor ? all.findIndex((r) => r.id === cursor) + 1 : 0;
      return all.slice(start, start + limit);
    },
    async countAll() {
      return rows.size;
    },
  };
}
