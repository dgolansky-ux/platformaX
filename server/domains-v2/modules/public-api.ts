/**
 * modules — public API surface (BACKEND_PARTIAL).
 * Other domains/use-cases import ONLY from here.
 */
export { createModulesService } from "./service";
export type {
  ModulesService,
  ModulesServiceDeps,
  ModulesResult,
  ModulesErrorCode,
  ModulesClock,
} from "./service";
export { createInMemoryModuleEnablementStore } from "./store";
export type { ModuleEnablementStore } from "./store";
export { MODULE_DEFINITIONS } from "./definitions";
export {
  MODULE_KEYS,
  type ModuleKey,
  type ModuleOwnerType,
  type ModuleStatus,
  type ModuleDefinitionDTO,
  type ModuleEnablementDTO,
} from "./dto";
export { isWhitelistedModuleKey, canEnableForOwnerType } from "./policy";
