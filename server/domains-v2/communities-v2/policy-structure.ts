/**
 * communities-v2 — pure structure policy. No I/O, no time, no side effects.
 *
 * Mirrors legacy hierarchy rules (docs/hierarchy-system.md): max 5 levels
 * (depth 0..4), only owner/admin of the PARENT may create/move/deactivate a
 * child, no cycles, no move-to-self, no move-under-own-descendant.
 */
import type { CommunityRole, CommunityVisibility } from "./dto";
import type { StructureNodeStatus } from "./dto-structure";

/** Deepest allowed node depth. depth 0 = root, so 5 levels total (0..4). */
export const MAX_STRUCTURE_DEPTH = 4;

/**
 * Who may see the structure of a community. Public communities are visible to
 * anyone; a private community's structure is visible only to its members.
 */
export function canViewStructure(
  visibility: CommunityVisibility,
  viewerRole: CommunityRole | null,
): boolean {
  if (visibility === "public") return true;
  return viewerRole !== null;
}

/** Founder/admin of the PARENT may create a subcommunity. Moderator/member may not. */
export function canCreateSubcommunity(parentRole: CommunityRole | null): boolean {
  return parentRole === "founder" || parentRole === "admin";
}

/** A child may be created only when the parent is not already at max depth. */
export function isDepthCreatable(parentDepth: number): boolean {
  return parentDepth < MAX_STRUCTURE_DEPTH;
}

/** Founder/admin of the node (or an ancestor) may move it. */
export function canMoveSubcommunity(actorRole: CommunityRole | null): boolean {
  return actorRole === "founder" || actorRole === "admin";
}

/** Founder/admin may deactivate a subcommunity. */
export function canDeactivateSubcommunity(actorRole: CommunityRole | null): boolean {
  return actorRole === "founder" || actorRole === "admin";
}

/** Founder/admin may reactivate a previously deactivated subcommunity. */
export function canReactivateSubcommunity(actorRole: CommunityRole | null): boolean {
  return actorRole === "founder" || actorRole === "admin";
}

/** Founder/admin of the PARENT may assign staff on a child. */
export function canAssignSubcommunityStaff(parentRole: CommunityRole | null): boolean {
  return parentRole === "founder" || parentRole === "admin";
}

/** Staff assignment may grant admin or moderator only — never founder/member. */
export function isAssignableStaffRole(role: CommunityRole): role is "admin" | "moderator" {
  return role === "admin" || role === "moderator";
}

/**
 * A move is illegal if the target parent is the node itself, or any descendant
 * of the node. `ancestorIdsOfTarget` is the chain of ancestor ids of the target
 * parent (root-first or any order — membership is all that matters).
 */
export function wouldCreateCycle(
  movingCommunityId: string,
  targetParentCommunityId: string,
  ancestorIdsOfTarget: readonly string[],
): boolean {
  if (movingCommunityId === targetParentCommunityId) return true;
  return ancestorIdsOfTarget.includes(movingCommunityId);
}

/** A deactivated node cannot be a parent for new/moved children. */
export function isUsableParent(status: StructureNodeStatus): boolean {
  return status === "active";
}
