/**
 * identity/workplaces — in-memory repository. BACKEND_PARTIAL.
 *
 * SCALABILITY_HOT_PATH_EXCEPTION: list reads return stable order (createdAt
 * desc + id tie-break) with bounded limit; durable DB adapter pending.
 */
import type { WorkplaceRecord, WorkplaceStatus } from "./dto";

export interface WorkplaceRepository {
  insert(record: WorkplaceRecord): Promise<void>;
  update(record: WorkplaceRecord): Promise<void>;
  getById(id: string): Promise<WorkplaceRecord | null>;
  getByOwnerSlug(ownerUserId: string, slug: string): Promise<WorkplaceRecord | null>;
  listForOwner(ownerUserId: string, includeArchived: boolean): Promise<readonly WorkplaceRecord[]>;
  countActiveForOwner(ownerUserId: string): Promise<number>;
}

function workplaceSort(a: WorkplaceRecord, b: WorkplaceRecord): number {
  if (a.createdAt === b.createdAt) return a.id < b.id ? -1 : 1;
  return a.createdAt < b.createdAt ? 1 : -1;
}

export function createInMemoryWorkplaceRepository(): WorkplaceRepository {
  const rows = new Map<string, WorkplaceRecord>();
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
    async getByOwnerSlug(ownerUserId, slug) {
      for (const r of rows.values()) {
        if (r.ownerUserId === ownerUserId && r.slug === slug) return r;
      }
      return null;
    },
    async listForOwner(ownerUserId, includeArchived) {
      const all = [...rows.values()]
        .filter((r) => r.ownerUserId === ownerUserId)
        .filter((r) => includeArchived || r.status !== "archived")
        .sort(workplaceSort);
      return all;
    },
    async countActiveForOwner(ownerUserId) {
      const ACTIVE: ReadonlySet<WorkplaceStatus> = new Set<WorkplaceStatus>(["draft", "active"]);
      let count = 0;
      for (const r of rows.values()) {
        if (r.ownerUserId === ownerUserId && ACTIVE.has(r.status)) count += 1;
      }
      return count;
    },
  };
}
