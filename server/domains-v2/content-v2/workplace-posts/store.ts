/**
 * content-v2/workplace-posts — in-memory repository.
 *
 * SCALABILITY_HOT_PATH_EXCEPTION: list returns stable order (createdAt desc +
 * id tie-break) with cursor + bounded limit. Durable adapter pending.
 */
import type { WorkplacePostRecord, WorkplacePostStatus } from "./dto";
import type { WorkplacePostRepository } from "./ports";

function postsSort(a: WorkplacePostRecord, b: WorkplacePostRecord): number {
  if (a.createdAt === b.createdAt) return a.id < b.id ? 1 : -1;
  return a.createdAt < b.createdAt ? 1 : -1;
}

export function createInMemoryWorkplacePostRepository(): WorkplacePostRepository {
  const rows = new Map<string, WorkplacePostRecord>();
  const ACTIVE: ReadonlySet<WorkplacePostStatus> = new Set<WorkplacePostStatus>(["published", "edited"]);
  return {
    async insert(record) {
      rows.set(record.id, record);
    },
    async update(record) {
      rows.set(record.id, record);
    },
    async getById(id) {
      return rows.get(id) ?? null;
    },
    async listForWorkplace(workplaceId, cursor, limit) {
      const all = [...rows.values()]
        .filter((r) => r.workplaceId === workplaceId && ACTIVE.has(r.status))
        .sort(postsSort);
      const start = cursor ? all.findIndex((r) => r.id === cursor) + 1 : 0;
      return all.slice(start, start + limit);
    },
  };
}
