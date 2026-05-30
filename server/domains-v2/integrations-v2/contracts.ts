/**
 * integrations-v2 — cross-domain contracts.
 */
import type { IntegrationOwnerType } from "./dto";

export interface IntegrationOwnershipResolver {
  canManageIntegrationsForOwner(
    actorUserId: string,
    ownerType: IntegrationOwnerType,
    ownerId: string,
  ): Promise<boolean>;
}

export interface IntegrationModuleEnablementResolver {
  isIntegrationsEnabled(ownerType: IntegrationOwnerType, ownerId: string): Promise<boolean>;
}
