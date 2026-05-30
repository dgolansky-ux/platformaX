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
  MODULE_VISIBILITIES,
  type ModuleKey,
  type ModuleOwnerType,
  type ModuleStatus,
  type ModuleVisibility,
  type ModuleCategory,
  type ModuleDefinitionDTO,
  type ModuleEnablementDTO,
} from "./dto";
export {
  isWhitelistedModuleKey,
  isModuleVisibility,
  canEnableForOwnerType,
  isVisibilitySupported,
  defaultVisibilityFor,
  definitionFor,
} from "./policy";
