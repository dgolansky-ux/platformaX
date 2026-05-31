/**
 * modules — in-memory enablement store (BACKEND_PARTIAL). One row per
 * (ownerType, ownerId, moduleKey); upsert replaces and preserves createdAt.
 */
import type { ModuleEnablementDTO } from "./dto";

export interface ModuleEnablementStore {
  upsert(record: ModuleEnablementDTO): Promise<ModuleEnablementDTO>;
  listForOwner(ownerType: string, ownerId: string): Promise<ModuleEnablementDTO[]>;
  get(ownerType: string, ownerId: string, moduleKey: string): Promise<ModuleEnablementDTO | null>;
}

export function createInMemoryModuleEnablementStore(): ModuleEnablementStore {
  const rows = new Map<string, ModuleEnablementDTO>();
  const key = (t: string, id: string, k: string) => `${t}|${id}|${k}`;
  return {
    async upsert(record) {
      const existing = rows.get(key(record.ownerType, record.ownerId, record.moduleKey));
      const merged: ModuleEnablementDTO = existing
        ? { ...record, createdAt: existing.createdAt }
        : record;
      rows.set(key(record.ownerType, record.ownerId, record.moduleKey), merged);
      return merged;
    },
    async listForOwner(ownerType, ownerId) {
      return [...rows.values()]
        .filter((r) => r.ownerType === ownerType && r.ownerId === ownerId)
        .sort((a, b) => a.order - b.order || a.moduleKey.localeCompare(b.moduleKey));
    },
    async get(ownerType, ownerId, moduleKey) {
      return rows.get(key(ownerType, ownerId, moduleKey)) ?? null;
    },
  };
}
