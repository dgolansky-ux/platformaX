/**
 * modules — service. Defines slots + enablement only; stores NO business data
 * (the owner domain keeps the real module data). No PII.
 */
import {
  MODULE_DEFINITIONS,
} from "./definitions";
import type {
  ModuleDefinitionDTO,
  ModuleEnablementDTO,
  ModuleKey,
  ModuleOwnerType,
} from "./dto";
import { canEnableForOwnerType, isWhitelistedModuleKey } from "./policy";
import type { ModuleEnablementStore } from "./store";

export type ModulesClock = { now: () => Date };
export type ModulesServiceDeps = { store: ModuleEnablementStore; clock: ModulesClock };

export type ModulesErrorCode = "UNKNOWN_MODULE" | "OWNER_TYPE_NOT_ALLOWED";
export type ModulesResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ModulesErrorCode; message: string } };

export interface ModulesService {
  listDefinitions(): ModuleDefinitionDTO[];
  enableForOwner(input: { ownerType: ModuleOwnerType; ownerId: string; moduleKey: string }): Promise<ModulesResult<ModuleEnablementDTO>>;
  disableForOwner(input: { ownerType: ModuleOwnerType; ownerId: string; moduleKey: string }): Promise<ModulesResult<ModuleEnablementDTO>>;
  listEnabledForOwner(ownerType: ModuleOwnerType, ownerId: string): Promise<ModuleEnablementDTO[]>;
}

export function createModulesService(deps: ModulesServiceDeps): ModulesService {
  async function setEnabled(
    ownerType: ModuleOwnerType,
    ownerId: string,
    moduleKey: string,
    enabled: boolean,
  ): Promise<ModulesResult<ModuleEnablementDTO>> {
    if (!isWhitelistedModuleKey(moduleKey)) {
      return { ok: false, error: { code: "UNKNOWN_MODULE", message: `Unknown module: ${moduleKey}` } };
    }
    const key: ModuleKey = moduleKey;
    if (enabled && !canEnableForOwnerType(key, ownerType)) {
      return { ok: false, error: { code: "OWNER_TYPE_NOT_ALLOWED", message: `Module ${key} not allowed for ${ownerType}` } };
    }
    const record: ModuleEnablementDTO = {
      ownerType, ownerId, moduleKey: key, enabled, updatedAt: deps.clock.now().toISOString(),
    };
    await deps.store.upsert(record);
    return { ok: true, value: record };
  }

  return {
    listDefinitions() {
      return [...MODULE_DEFINITIONS].sort((a, b) => a.order - b.order);
    },
    enableForOwner: ({ ownerType, ownerId, moduleKey }) => setEnabled(ownerType, ownerId, moduleKey, true),
    disableForOwner: ({ ownerType, ownerId, moduleKey }) => setEnabled(ownerType, ownerId, moduleKey, false),
    async listEnabledForOwner(ownerType, ownerId) {
      return (await deps.store.listForOwner(ownerType, ownerId)).filter((r) => r.enabled);
    },
  };
}
