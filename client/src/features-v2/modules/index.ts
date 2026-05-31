/**
 * features-v2/modules — UI feature barrel
 * Status: UI_SHELL_ONLY + MOCK_LOCAL_ONLY (no @server/* imports).
 */
export { ModulesManageView } from "./ModulesManageView";
export { modulesMockAdapter } from "./mock-adapter";
export type {
  ModuleOwnerType,
  ModuleKey,
  ModuleVisibility,
  ModuleDefinitionUiDTO,
  ModuleEnablementUiDTO,
  ModuleOwnerContextUiDTO,
  ToggleModuleInput,
} from "./types";
