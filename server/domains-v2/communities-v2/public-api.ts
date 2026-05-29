/**
 * communities-v2 — public API surface (BACKEND_PARTIAL).
 *
 * Other domains/use-cases import ONLY from here. Internal modules (repository,
 * service impl, policy, ports, mapper) must NOT be reached cross-domain.
 */
export { createCommunitiesService } from "./service";
export type {
  CommunitiesService,
  CommunitiesServiceDeps,
  CommunitiesResult,
  CommunitiesErrorCode,
  CommunitiesClock,
  CommunitiesIdGenerator,
} from "./service";
export {
  createInMemoryCommunityRepository,
  createInMemoryMembershipRepository,
  createInMemoryJoinRequestRepository,
  createInMemoryInviteRepository,
  createInMemoryHierarchyRepository,
} from "./store";
export type {
  CommunityRepository,
  MembershipRepository,
  JoinRequestRepository,
  InviteRepository,
  HierarchyRepository,
  CommunityHierarchyRecord,
} from "./ports";
export { createCommunityStructureService } from "./service-structure";
export type {
  CommunityStructureService,
  StructureServiceDeps,
} from "./service-structure";
export type {
  SubcommunityDTO,
  CommunityStructureDTO,
  CommunityBreadcrumbDTO,
  StructureNodeStatus,
  StructureErrorCode,
  StructureResult,
  SubcommunityStaffRole,
  SubcommunityStaffAssignment,
  CreateSubcommunityInput,
  AssignSubcommunityStaffInput,
  UpdateSubcommunityBasicsInput,
  MoveSubcommunityInput,
  DeactivateSubcommunityInput,
  ReactivateSubcommunityInput,
} from "./dto-structure";
export {
  MAX_STRUCTURE_DEPTH,
  canViewStructure,
  canCreateSubcommunity,
  canMoveSubcommunity,
  canDeactivateSubcommunity,
  canReactivateSubcommunity,
  canAssignSubcommunityStaff,
  isAssignableStaffRole,
  isDepthCreatable,
  wouldCreateCycle,
} from "./policy-structure";
export type {
  CommunityPublicDTO,
  CommunityAdminDTO,
  CommunityMemberDTO,
  CommunityJoinRequestDTO,
  CommunityRole,
  CommunityVisibility,
  CommunityStatus,
  CommunityViewerRelation,
  CommunityViewerStateDTO,
  CommunityInviteStatus,
  CommunityInvitePublicDTO,
  CommunityInviteManageDTO,
  CreateCommunityInput,
  CreateCommunityInviteInput,
  CancelCommunityInviteInput,
  RemoveMemberInput,
  UpdateCommunitySettingsInput,
  DecideJoinRequestInput,
  ChangeMemberRoleInput,
} from "./dto";
export type { CommunityPublicSummary, CommunityAuthorityResolver } from "./contracts";
export {
  hasCommunityAuthority,
  canRemoveMember,
  isValidCommunitySlug,
  canChangeRole,
  canLeaveCommunity,
  canCancelOwnJoinRequest,
  canManageInvites,
} from "./policy";
export { COMMUNITY_CATEGORIES, isValidCategorySlug, type CommunityCategoryRef } from "./categories";
