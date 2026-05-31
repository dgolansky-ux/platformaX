/**
 * communities-v2 — structure service factory (Slice 4). Owns the community
 * hierarchy (parent/root/depth/path) and subcommunity lifecycle. Reuses the
 * communities + membership repositories (shared source of truth) plus a
 * dedicated hierarchy repository. Method bodies live as module functions in
 * service-structure-read / service-structure-write so this factory stays small.
 */
import type {
  AssignSubcommunityStaffInput,
  CommunityBreadcrumbDTO,
  CommunityStructureDTO,
  CreateSubcommunityInput,
  DeactivateSubcommunityInput,
  MoveSubcommunityInput,
  ReactivateSubcommunityInput,
  StructureResult,
  SubcommunityDTO,
  UpdateSubcommunityBasicsInput,
} from "./dto-structure";
import {
  getCommunityStructure,
  getStructureBreadcrumbs,
  listSubcommunities,
} from "./service-structure-read";
import {
  assignSubcommunityStaff,
  createSubcommunity,
  deactivateSubcommunity,
  moveSubcommunity,
  reactivateSubcommunity,
  updateSubcommunityBasics,
} from "./service-structure-write";
import type { StructureServiceDeps } from "./service-structure-shared";

export type { StructureServiceDeps } from "./service-structure-shared";

export interface CommunityStructureService {
  getCommunityStructure(
    communityId: string,
    viewerUserId: string | null,
  ): Promise<StructureResult<CommunityStructureDTO>>;
  listSubcommunities(
    communityId: string,
    viewerUserId: string | null,
  ): Promise<StructureResult<SubcommunityDTO[]>>;
  getStructureBreadcrumbs(communityId: string): Promise<StructureResult<CommunityBreadcrumbDTO[]>>;
  createSubcommunity(input: CreateSubcommunityInput): Promise<StructureResult<SubcommunityDTO>>;
  updateSubcommunityBasics(input: UpdateSubcommunityBasicsInput): Promise<StructureResult<SubcommunityDTO>>;
  moveSubcommunity(input: MoveSubcommunityInput): Promise<StructureResult<SubcommunityDTO>>;
  deactivateSubcommunity(input: DeactivateSubcommunityInput): Promise<StructureResult<SubcommunityDTO>>;
  reactivateSubcommunity(input: ReactivateSubcommunityInput): Promise<StructureResult<SubcommunityDTO>>;
  assignSubcommunityStaff(input: AssignSubcommunityStaffInput): Promise<StructureResult<SubcommunityDTO>>;
}

export function createCommunityStructureService(
  deps: StructureServiceDeps,
): CommunityStructureService {
  return {
    getCommunityStructure: (communityId, viewerUserId) =>
      getCommunityStructure(deps, communityId, viewerUserId),
    listSubcommunities: (communityId, viewerUserId) =>
      listSubcommunities(deps, communityId, viewerUserId),
    getStructureBreadcrumbs: (communityId) => getStructureBreadcrumbs(deps, communityId),
    createSubcommunity: (input) => createSubcommunity(deps, input),
    updateSubcommunityBasics: (input) => updateSubcommunityBasics(deps, input),
    moveSubcommunity: (input) => moveSubcommunity(deps, input),
    deactivateSubcommunity: (input) => deactivateSubcommunity(deps, input),
    reactivateSubcommunity: (input) => reactivateSubcommunity(deps, input),
    assignSubcommunityStaff: (input) => assignSubcommunityStaff(deps, input),
  };
}
