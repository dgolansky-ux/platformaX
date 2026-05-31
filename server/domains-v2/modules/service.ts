/**
 * modules — service. Defines slots + enablement only; stores NO business data
 * (the owner domain keeps the real module data). No PII.
 *
 * FIXED_CAP: per-owner enablement rows are bounded by MODULE_DEFINITIONS
 * (currently 5 entries); no pagination is necessary for `listAllForOwner`.
 */
import { MODULE_DEFINITIONS } from "./definitions";
import type {
  ModuleDefinitionDTO,
  ModuleEnablementDTO,
  ModuleKey,
  ModuleOwnerType,
  ModuleVisibility,
} from "./dto";
import {
  canEnableForOwnerType,
  defaultVisibilityFor,
  definitionFor,
  isModuleVisibility,
  isVisibilitySupported,
  isWhitelistedModuleKey,
} from "./policy";
import type { ModuleEnablementStore } from "./store";

export type ModulesClock = { now: () => Date };
export type ModulesServiceDeps = { store: ModuleEnablementStore; clock: ModulesClock };

export type ModulesErrorCode =
  | "UNKNOWN_MODULE"
  | "OWNER_TYPE_NOT_ALLOWED"
  | "INVALID_VISIBILITY";

export type ModulesResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ModulesErrorCode; message: string } };

export type SetEnablementInput = {
  ownerType: ModuleOwnerType;
  ownerId: string;
  moduleKey: string;
  enabled: boolean;
  visibility?: string;
  order?: number;
};

export interface ModulesService {
  listDefinitions(): ModuleDefinitionDTO[];
  enableForOwner(input: {
    ownerType: ModuleOwnerType;
    ownerId: string;
    moduleKey: string;
    visibility?: string;
    order?: number;
  }): Promise<ModulesResult<ModuleEnablementDTO>>;
  disableForOwner(input: { ownerType: ModuleOwnerType; ownerId: string; moduleKey: string }): Promise<ModulesResult<ModuleEnablementDTO>>;
  setVisibility(input: {
    ownerType: ModuleOwnerType;
    ownerId: string;
    moduleKey: string;
    visibility: string;
  }): Promise<ModulesResult<ModuleEnablementDTO>>;
  listEnabledForOwner(ownerType: ModuleOwnerType, ownerId: string): Promise<ModuleEnablementDTO[]>;
  listAllForOwner(ownerType: ModuleOwnerType, ownerId: string): Promise<ModuleEnablementDTO[]>;
}

function defaultOrderFor(key: ModuleKey): number {
  return definitionFor(key)?.order ?? 100;
}

export function createModulesService(deps: ModulesServiceDeps): ModulesService {
  async function setEnabled(input: SetEnablementInput): Promise<ModulesResult<ModuleEnablementDTO>> {
    if (!isWhitelistedModuleKey(input.moduleKey)) {
      return { ok: false, error: { code: "UNKNOWN_MODULE", message: `Unknown module: ${input.moduleKey}` } };
    }
    const key: ModuleKey = input.moduleKey;
    if (input.enabled && !canEnableForOwnerType(key, input.ownerType)) {
      return { ok: false, error: { code: "OWNER_TYPE_NOT_ALLOWED", message: `Module ${key} not allowed for ${input.ownerType}` } };
    }
    let visibility: ModuleVisibility;
    if (input.visibility !== undefined) {
      if (!isModuleVisibility(input.visibility) || !isVisibilitySupported(key, input.visibility)) {
        return { ok: false, error: { code: "INVALID_VISIBILITY", message: `Visibility ${input.visibility} not supported for ${key}` } };
      }
      visibility = input.visibility;
    } else {
      const existing = await deps.store.get(input.ownerType, input.ownerId, key);
      visibility = existing?.visibility ?? defaultVisibilityFor(key);
    }
    const now = deps.clock.now().toISOString();
    const record: ModuleEnablementDTO = {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      moduleKey: key,
      enabled: input.enabled,
      visibility,
      order: input.order ?? defaultOrderFor(key),
      createdAt: now,
      updatedAt: now,
    };
    const stored = await deps.store.upsert(record);
    return { ok: true, value: stored };
  }

  return {
    listDefinitions() {
      return [...MODULE_DEFINITIONS].sort((a, b) => a.order - b.order);
    },
    enableForOwner: (input) =>
      setEnabled({ ...input, enabled: true }),
    disableForOwner: ({ ownerType, ownerId, moduleKey }) =>
      setEnabled({ ownerType, ownerId, moduleKey, enabled: false }),
    async setVisibility({ ownerType, ownerId, moduleKey, visibility }) {
      if (!isWhitelistedModuleKey(moduleKey)) {
        return { ok: false, error: { code: "UNKNOWN_MODULE", message: `Unknown module: ${moduleKey}` } };
      }
      const key: ModuleKey = moduleKey;
      if (!isModuleVisibility(visibility) || !isVisibilitySupported(key, visibility)) {
        return { ok: false, error: { code: "INVALID_VISIBILITY", message: `Visibility ${visibility} not supported for ${key}` } };
      }
      const existing = await deps.store.get(ownerType, ownerId, key);
      const now = deps.clock.now().toISOString();
      const record: ModuleEnablementDTO = {
        ownerType,
        ownerId,
        moduleKey: key,
        enabled: existing?.enabled ?? false,
        visibility,
        order: existing?.order ?? defaultOrderFor(key),
        createdAt: now,
        updatedAt: now,
      };
      const stored = await deps.store.upsert(record);
      return { ok: true, value: stored };
    },
    async listEnabledForOwner(ownerType, ownerId) {
      return (await deps.store.listForOwner(ownerType, ownerId)).filter((r) => r.enabled);
    },
    async listAllForOwner(ownerType, ownerId) {
      return deps.store.listForOwner(ownerType, ownerId);
    },
  };
}
