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
} from "./store";
export type {
  CommunityRepository,
  MembershipRepository,
  JoinRequestRepository,
} from "./ports";
export type {
  CommunityPublicDTO,
  CommunityAdminDTO,
  CommunityMemberDTO,
  CommunityJoinRequestDTO,
  CommunityRole,
  CommunityVisibility,
  CommunityStatus,
  CreateCommunityInput,
  UpdateCommunitySettingsInput,
} from "./dto";
export { hasCommunityAuthority, canRemoveMember, isValidCommunitySlug } from "./policy";
