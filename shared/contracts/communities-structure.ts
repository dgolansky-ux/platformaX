/**
 * shared/contracts/communities-structure — frontend-facing community structure
 * (hierarchy / subcommunity) DTOs + action inputs for Slice 4.
 *
 * privacy classification: Public/structure DTOs — no PII. Staff candidates
 * expose userId + displayName + role only (no email/phone), mirroring the
 * members summary used elsewhere in communities-v2.
 */
import type { CommunityRole, CommunityVisibility } from "./communities";

export type StructureNodeStatus = "active" | "deactivated";

export type CommunityStructureNodeDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  visibility: CommunityVisibility;
  parentId: string | null;
  rootId: string;
  depth: number;
  sortOrder: number;
  status: StructureNodeStatus;
  memberCount: number;
  childCount: number;
  viewerRole: CommunityRole | null;
};

export type CommunityStructureBreadcrumbDTO = {
  id: string;
  slug: string;
  name: string;
  depth: number;
};

export type CommunityStructureViewDTO = {
  root: CommunityStructureNodeDTO;
  current: CommunityStructureNodeDTO;
  parent: CommunityStructureNodeDTO | null;
  children: readonly CommunityStructureNodeDTO[];
  breadcrumbs: readonly CommunityStructureBreadcrumbDTO[];
  tree: readonly CommunityStructureNodeDTO[];
  depth: number;
  maxDepth: number;
  canManage: boolean;
  canCreateChild: boolean;
  canMove: boolean;
  canDeactivate: boolean;
};

/** A parent member eligible to become staff of a new subcommunity. No PII. */
export type SubcommunityStaffCandidateDTO = {
  userId: string;
  displayName: string;
  role: CommunityRole;
};

export type SubcommunityStaffPick = {
  userId: string;
  role: "admin" | "moderator";
};

export type CreateSubcommunityFrontendInput = {
  parentId: string;
  name: string;
  slug: string;
  description?: string;
  visibility?: "public" | "private";
  categorySlug?: string | null;
  topic?: string;
  operatingMode?: "in_person" | "online" | "hybrid";
  locationCity?: string;
  founderJoins?: boolean;
  staff?: readonly SubcommunityStaffPick[];
};

export type MoveSubcommunityFrontendInput = {
  communityId: string;
  newParentId: string;
};

export type UpdateSubcommunityBasicsFrontendInput = {
  communityId: string;
  name?: string;
  description?: string;
  visibility?: "public" | "private";
};

export type DeactivateSubcommunityFrontendInput = {
  communityId: string;
};
