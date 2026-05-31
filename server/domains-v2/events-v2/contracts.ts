/**
 * events-v2 — cross-domain contracts. Ownership + module enablement are
 * resolved by the application layer; events-v2 never imports other domains.
 */
import type { EventOwnerType } from "./dto";

export interface EventOwnershipResolver {
  canManageEventsForOwner(
    actorUserId: string,
    ownerType: EventOwnerType,
    ownerId: string,
  ): Promise<boolean>;
}

export interface EventModuleEnablementResolver {
  isEventsEnabled(ownerType: EventOwnerType, ownerId: string): Promise<boolean>;
}
