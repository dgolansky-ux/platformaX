/**
 * communities-v2 — structure (hierarchy / subcommunities) DTOs + inputs.
 *
 * Slice 4. A community can be the root of a tree or a subcommunity nested under
 * a parent. Held in its own module so dto.ts stays under the export budget.
 *
 * privacy classification: Public/structure DTOs carry NO PII — only ids, slug,
 * name, description, visibility, counts, depth, status and the viewer's own
 * role. Staff candidate entries expose userId + displayName only (no
 * email/phone), matching the rest of communities-v2.
 */
import type { CommunityRole, CommunityVisibility } from "./dto";

/** Soft lifecycle of a node in the structure. Never hard-deleted. */
export type StructureNodeStatus = "active" | "deactivated";

/**
 * A single node in a community tree (root or subcommunity). No PII. `childCount`
 * counts only ACTIVE direct children. `viewerRole` is the requesting viewer's
 * own membership role in that node (null = not a member).
 */
export type SubcommunityDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  visibility: CommunityVisibility;
  parentCommunityId: string | null;
  rootCommunityId: string;
  depth: number;
  sortOrder: number;
  status: StructureNodeStatus;
  memberCount: number;
  childCount: number;
  viewerRole: CommunityRole | null;
};

/** One hop on the path from root to the current node. */
export type CommunityBreadcrumbDTO = {
  id: string;
  slug: string;
  name: string;
  depth: number;
};

/**
 * The full structure view for one community: where it sits, its parent, its
 * direct children, the breadcrumb trail to root, and the viewer's capabilities.
 * `tree` is the flat list of all nodes in the same tree (root + descendants) so
 * the client can render either the nested tree or a flat list without a second
 * round-trip.
 */
export type CommunityStructureDTO = {
  root: SubcommunityDTO;
  current: SubcommunityDTO;
  parent: SubcommunityDTO | null;
  children: readonly SubcommunityDTO[];
  breadcrumbs: readonly CommunityBreadcrumbDTO[];
  tree: readonly SubcommunityDTO[];
  depth: number;
  maxDepth: number;
  canCreateChild: boolean;
  canMove: boolean;
  canDeactivate: boolean;
};

/** Staff role assignable on a subcommunity (founder is the creator, set apart). */
export type SubcommunityStaffRole = Extract<CommunityRole, "admin" | "moderator">;

export type SubcommunityStaffAssignment = {
  userId: string;
  role: SubcommunityStaffRole;
};

export type CreateSubcommunityInput = {
  actorUserId: string;
  parentCommunityId: string;
  name: string;
  slug: string;
  description?: string;
  visibility?: CommunityVisibility;
  categorySlug?: string | null;
  /** Legacy `joinAsMember`: when true the creator becomes founder+member. */
  founderJoins?: boolean;
};

export type AssignSubcommunityStaffInput = {
  actorUserId: string;
  /** The subcommunity receiving staff. */
  communityId: string;
  staff: readonly SubcommunityStaffAssignment[];
};

export type UpdateSubcommunityBasicsInput = {
  actorUserId: string;
  communityId: string;
  name?: string;
  description?: string;
  visibility?: CommunityVisibility;
};

export type MoveSubcommunityInput = {
  actorUserId: string;
  communityId: string;
  newParentCommunityId: string;
};

export type DeactivateSubcommunityInput = {
  actorUserId: string;
  communityId: string;
};

export type ReactivateSubcommunityInput = {
  actorUserId: string;
  communityId: string;
};

export type StructureErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_SLUG"
  | "SLUG_TAKEN"
  | "INVALID_CATEGORY"
  | "MAX_DEPTH_EXCEEDED"
  | "MOVE_TO_SELF"
  | "MOVE_TO_DESCENDANT"
  | "CYCLE_DETECTED"
  | "NOT_A_SUBCOMMUNITY"
  | "HAS_ACTIVE_CHILDREN"
  | "ALREADY_DEACTIVATED"
  | "ALREADY_ACTIVE"
  | "PARENT_DEACTIVATED"
  | "INVALID_STAFF_ROLE"
  | "STAFF_NOT_ELIGIBLE";

export type StructureResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: StructureErrorCode; message: string } };
