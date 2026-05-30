/**
 * content-v2/workplace-posts — cross-domain ports.
 *
 * The workplace-posts service does NOT import identity internals. The
 * application layer wires these resolvers from `identity/workplaces.public-api`
 * + `social.public-api`.
 */

export interface WorkplaceOwnershipResolver {
  /** Is the actor the owner of this workplace? */
  isWorkplaceOwner(actorUserId: string, workplaceId: string): Promise<boolean>;
  /** Resolve the owner of a workplace (used for visibility checks). */
  getWorkplaceOwner(workplaceId: string): Promise<string | null>;
}

export interface WorkplacePostFriendshipResolver {
  areFriends(viewerUserId: string, ownerUserId: string): Promise<boolean>;
}
