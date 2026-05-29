/**
 * modules — in-memory enablement store (BACKEND_PARTIAL). One row per
 * (ownerType, ownerId, moduleKey); enabling twice updates the same row.
 */
import type { ModuleEnablementDTO } from "./dto";

export interface ModuleEnablementStore {
  upsert(record: ModuleEnablementDTO): Promise<void>;
  listForOwner(ownerType: string, ownerId: string): Promise<ModuleEnablementDTO[]>;
}

export function createInMemoryModuleEnablementStore(): ModuleEnablementStore {
  const rows = new Map<string, ModuleEnablementDTO>();
  const key = (t: string, id: string, k: string) => `${t}|${id}|${k}`;
  return {
    async upsert(record) {
      rows.set(key(record.ownerType, record.ownerId, record.moduleKey), record);
    },
    async listForOwner(ownerType, ownerId) {
      return [...rows.values()].filter(
        (r) => r.ownerType === ownerType && r.ownerId === ownerId,
      );
    },
  };
}
