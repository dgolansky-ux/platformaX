// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-OBS-003-ACK: pre-runtime use-case; request-context tracing wiring scheduled with RequestContext slice. EXC-016.
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * application-v2/use-cases/communities — orchestration.
 *
 * createCommunityWithDefaults composes **communities-v2** (community + founder
 * membership, created atomically by the domain) with **modules** (enabling a
 * bounded set of default modules for the new community). Each step calls only
 * the domain `public-api.ts`; this layer owns no data.
 */
import type { CommunityAuthorityResolver } from "@server/domains-v2/communities-v2/contracts";
import type {
  CancelCommunityInviteInput,
  CommunitiesService,
  CommunityInviteManageDTO,
  CommunityJoinRequestDTO,
  CommunityMemberDTO,
  CommunityPublicDTO,
  CommunityViewerStateDTO,
  CommunitiesErrorCode,
  CreateCommunityInput,
  CreateCommunityInviteInput,
  DecideJoinRequestInput,
  RemoveMemberInput,
  UpdateCommunitySettingsInput,
} from "@server/domains-v2/communities-v2/public-api";
import type {
  ModuleEnablementDTO,
  ModulesErrorCode,
  ModulesService,
} from "@server/domains-v2/modules/public-api";

export type CreateCommunityWithDefaultsDeps = {
  communities: CommunitiesService;
  modules: ModulesService;
  /** Bounded config: module keys auto-enabled for a new community. */
  defaultModuleKeys?: readonly string[];
  /** Authority resolver — optional, only used by enableCommunityModule. */
  authority?: CommunityAuthorityResolver;
};

export type EnableCommunityModuleInput = {
  actorUserId: string;
  communityId: string;
  moduleKey: string;
  /** When true → enable, when false → disable. */
  enabled: boolean;
};

export type EnableCommunityModuleErrorCode = "FORBIDDEN" | ModulesErrorCode;

export type EnableCommunityModuleResult =
  | { ok: true; value: ModuleEnablementDTO }
  | { ok: false; error: { code: EnableCommunityModuleErrorCode; message: string } };

export type CreateCommunityWithDefaultsValue = {
  community: CommunityPublicDTO;
  enabledModules: ModuleEnablementDTO[];
};

export type CreateCommunityWithDefaultsResult =
  | { ok: true; value: CreateCommunityWithDefaultsValue }
  | { ok: false; error: { code: CommunitiesErrorCode; message: string } };

export type CommunityProfileView = {
  profile: CommunityPublicDTO;
  viewer: CommunityViewerStateDTO;
};

export type GetCommunityProfileViewResult =
  | { ok: true; value: CommunityProfileView }
  | { ok: false; error: { code: CommunitiesErrorCode; message: string } };

export type CommunityMembershipActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: CommunitiesErrorCode; message: string } };

export type CommunityManageView = {
  profile: CommunityPublicDTO;
  viewer: CommunityViewerStateDTO;
  members: readonly CommunityMemberDTO[];
  joinRequests: readonly CommunityJoinRequestDTO[];
  invites: readonly CommunityInviteManageDTO[];
};

export type GetCommunityManageViewResult =
  | { ok: true; value: CommunityManageView }
  | { ok: false; error: { code: CommunitiesErrorCode; message: string } };

export interface CommunitiesUseCase {
  createCommunityWithDefaults(input: CreateCommunityInput): Promise<CreateCommunityWithDefaultsResult>;
  enableCommunityModule(input: EnableCommunityModuleInput): Promise<EnableCommunityModuleResult>;
  getCommunityProfileView(slug: string, viewerUserId: string | null): Promise<GetCommunityProfileViewResult>;
  getCommunityViewerState(communityId: string, viewerUserId: string | null): Promise<CommunityMembershipActionResult<CommunityViewerStateDTO>>;
  joinCommunity(communityId: string, viewerUserId: string): Promise<CommunityMembershipActionResult<CommunityMemberDTO>>;
  requestJoinCommunity(communityId: string, viewerUserId: string): Promise<CommunityMembershipActionResult<CommunityJoinRequestDTO>>;
  cancelJoinRequest(communityId: string, joinRequestId: string, viewerUserId: string): Promise<CommunityMembershipActionResult<CommunityJoinRequestDTO>>;
  leaveCommunity(communityId: string, viewerUserId: string): Promise<CommunityMembershipActionResult<true>>;
  getCommunityManageView(slug: string, actorUserId: string): Promise<GetCommunityManageViewResult>;
  updateCommunitySettings(input: UpdateCommunitySettingsInput): Promise<CommunityMembershipActionResult<CommunityPublicDTO>>;
  changeCommunityMemberRole(input: import("@server/domains-v2/communities-v2/public-api").ChangeMemberRoleInput): Promise<CommunityMembershipActionResult<CommunityMemberDTO>>;
  removeCommunityMember(input: RemoveMemberInput): Promise<CommunityMembershipActionResult<true>>;
  acceptCommunityJoinRequest(input: DecideJoinRequestInput): Promise<CommunityMembershipActionResult<CommunityJoinRequestDTO>>;
  rejectCommunityJoinRequest(input: DecideJoinRequestInput): Promise<CommunityMembershipActionResult<CommunityJoinRequestDTO>>;
  createCommunityInvite(input: CreateCommunityInviteInput): Promise<CommunityMembershipActionResult<CommunityInviteManageDTO>>;
  cancelCommunityInvite(input: CancelCommunityInviteInput): Promise<CommunityMembershipActionResult<CommunityInviteManageDTO>>;
}

const MAX_DEFAULT_MODULES = 8;

export function createCommunitiesUseCase(deps: CreateCommunityWithDefaultsDeps): CommunitiesUseCase {
  return {
    async createCommunityWithDefaults(input) {
      const created = await deps.communities.createCommunity(input);
      if (!created.ok) return created;
      // SCALABILITY_EXCEPTION: bounded config list, not a write fanout
      const keys = (deps.defaultModuleKeys ?? []).slice(0, MAX_DEFAULT_MODULES);
      const results = await Promise.all(
        keys.map((moduleKey) =>
          deps.modules.enableForOwner({ ownerType: "community", ownerId: created.value.id, moduleKey }),
        ),
      );
      const enabledModules = results.flatMap((r) => (r.ok ? [r.value] : []));
      return { ok: true, value: { community: created.value, enabledModules } };
    },

    async enableCommunityModule(input) {
      const authority = deps.authority ?? deps.communities;
      const allowed = await authority.canManageCommunity(input.communityId, input.actorUserId);
      if (!allowed) {
        return { ok: false, error: { code: "FORBIDDEN", message: "Actor may not manage this community." } };
      }
      const op = input.enabled
        ? deps.modules.enableForOwner({ ownerType: "community", ownerId: input.communityId, moduleKey: input.moduleKey })
        : deps.modules.disableForOwner({ ownerType: "community", ownerId: input.communityId, moduleKey: input.moduleKey });
      const res = await op;
      if (!res.ok) return res;
      return { ok: true, value: res.value };
    },

    async getCommunityProfileView(slug, viewerUserId) {
      const profile = await deps.communities.getPublicCommunityBySlug(slug);
      if (!profile) {
        return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
      }
      const viewer = await deps.communities.getViewerState(profile.id, viewerUserId);
      if (!viewer.ok) return viewer;
      return { ok: true, value: { profile, viewer: viewer.value } };
    },

    getCommunityViewerState: (communityId, viewerUserId) => deps.communities.getViewerState(communityId, viewerUserId),
    joinCommunity: (communityId, viewerUserId) => deps.communities.joinCommunity(communityId, viewerUserId),
    requestJoinCommunity: (communityId, viewerUserId) => deps.communities.requestJoin(communityId, viewerUserId),
    cancelJoinRequest: (communityId, joinRequestId, viewerUserId) =>
      deps.communities.cancelJoinRequest(communityId, joinRequestId, viewerUserId),
    leaveCommunity: (communityId, viewerUserId) => deps.communities.leaveCommunity(communityId, viewerUserId),

    async getCommunityManageView(slug, actorUserId) {
      const profile = await deps.communities.getPublicCommunityBySlug(slug);
      if (!profile) return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
      const viewer = await deps.communities.getViewerState(profile.id, actorUserId);
      if (!viewer.ok) return viewer;
      if (!viewer.value.canManage) {
        return { ok: false, error: { code: "FORBIDDEN", message: "Only founder/admin may open the manage view." } };
      }
      const [members, requests, invites] = await Promise.all([
        deps.communities.listMembers(profile.id, actorUserId),
        deps.communities.listPendingJoinRequests(profile.id, actorUserId),
        deps.communities.listInvitesForManage(profile.id, actorUserId),
      ]);
      if (!members.ok) return members;
      if (!requests.ok) return requests;
      if (!invites.ok) return invites;
      return {
        ok: true,
        value: { profile, viewer: viewer.value, members: members.value, joinRequests: requests.value, invites: invites.value },
      };
    },

    updateCommunitySettings: (input) => deps.communities.updateSettings(input),
    changeCommunityMemberRole: (input) => deps.communities.changeMemberRole(input),
    removeCommunityMember: (input) => deps.communities.removeMember(input),
    acceptCommunityJoinRequest: (input) => deps.communities.acceptJoinRequest(input),
    rejectCommunityJoinRequest: (input) => deps.communities.rejectJoinRequest(input),
    createCommunityInvite: (input) => deps.communities.createInvite(input),
    cancelCommunityInvite: (input) => deps.communities.cancelInvite(input),
  };
}
