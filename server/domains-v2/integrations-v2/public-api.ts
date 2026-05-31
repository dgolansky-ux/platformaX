// PX-CONTRACT-001-ACK: scaffold-stage domain; public-api contract test will land when the domain reaches PARTIAL_RUNTIME. EXC-016.
/**
 * integrations-v2 — public API surface (FOUNDATION_READY).
 */
export { createIntegrationsService } from "./service";
export type {
  IntegrationsService,
  IntegrationsServiceDeps,
  IntegrationsResult,
  IntegrationsErrorCode,
  IntegrationsClock,
  IntegrationsIdGen,
} from "./service";
export { createInMemoryIntegrationRepository } from "./store";
export type { IntegrationRepository } from "./store";
export type {
  IntegrationOwnershipResolver,
  IntegrationModuleEnablementResolver,
} from "./contracts";
export type {
  IntegrationDTO,
  IntegrationPublicDTO,
  IntegrationOwnerType,
  IntegrationVisibility,
  IntegrationStatus,
  IntegrationKind,
  CreateIntegrationInput,
  UpdateIntegrationInput,
} from "./dto";
export {
  INTEGRATION_NAME_MAX,
  INTEGRATION_DESCRIPTION_MAX,
  INTEGRATION_URL_MAX,
} from "./dto";
export {
  isIntegrationVisibility,
  isIntegrationKind,
  validateIntegrationUrl,
} from "./policy";