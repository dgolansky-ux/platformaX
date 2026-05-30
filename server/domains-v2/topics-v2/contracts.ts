/**
 * topics-v2 — cross-domain contracts.
 *
 * TopicOwnershipResolver is implemented by the application layer. It tells the
 * topics domain whether an actor may manage topics for a given owner — without
 * the topics domain having to import identity or communities-v2 internals.
 */

import type { TopicOwnerType } from "./dto";

export interface TopicOwnershipResolver {
  /** Can this actor create / update / archive topics for this owner? */
  canManageTopicsForOwner(
    actorUserId: string,
    ownerType: TopicOwnerType,
    ownerId: string,
  ): Promise<boolean>;
}

export interface TopicModuleEnablementResolver {
  isTopicsEnabled(ownerType: TopicOwnerType, ownerId: string): Promise<boolean>;
}
