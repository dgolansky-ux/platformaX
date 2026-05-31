/**
 * communities-v2 — invite bridge.
 *
 * Wraps the invite operations with the "invites repo is optional" semantics
 * the service exposes. Living in a sibling file keeps service.ts under the
 * structural size limit.
 */
import type {
  CancelCommunityInviteInput,
  CommunityInviteManageDTO,
  CommunityInvitePublicDTO,
  CreateCommunityInviteInput,
} from "./dto";
import type { CommunityRepository, InviteRepository, MembershipRepository } from "./ports";
import {
  cancelInvite as cancelInviteOp,
  createInvite as createInviteOp,
  listInvitesForManage as listInvitesForManageOp,
  listInvitesPublic as listInvitesPublicOp,
  type InviteOpsErrorCode,
} from "./service-invite-ops";

type BridgeDeps = {
  communities: CommunityRepository;
  members: MembershipRepository;
  invites?: InviteRepository;
  clock: { now: () => Date };
  ids: { next: () => string };
};

type BridgeErrorCode = InviteOpsErrorCode | "INVITES_NOT_CONFIGURED";

type InviteResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: BridgeErrorCode; message: string } };

function notConfigured<T>(): InviteResult<T> {
  return { ok: false, error: { code: "INVITES_NOT_CONFIGURED", message: "Invite repository is not configured on this service instance." } };
}

export type InviteBridge = {
  createInvite(input: CreateCommunityInviteInput): Promise<InviteResult<CommunityInviteManageDTO>>;
  cancelInvite(input: CancelCommunityInviteInput): Promise<InviteResult<CommunityInviteManageDTO>>;
  listInvitesForManage(communityId: string, actorUserId: string): Promise<InviteResult<CommunityInviteManageDTO[]>>;
  listInvitesPublic(communityId: string): Promise<InviteResult<CommunityInvitePublicDTO[]>>;
};

export function createInviteBridge(deps: BridgeDeps): InviteBridge {
  const opsDeps = (inv: InviteRepository) => ({ ...deps, invites: inv, ids: deps.ids });
  return {
    createInvite: (input) => (deps.invites ? createInviteOp(opsDeps(deps.invites), input) : Promise.resolve(notConfigured())),
    cancelInvite: (input) => (deps.invites ? cancelInviteOp(opsDeps(deps.invites), input) : Promise.resolve(notConfigured())),
    listInvitesForManage: (communityId, actorUserId) =>
      deps.invites ? listInvitesForManageOp(opsDeps(deps.invites), communityId, actorUserId) : Promise.resolve(notConfigured()),
    listInvitesPublic: (communityId) =>
      deps.invites ? listInvitesPublicOp(opsDeps(deps.invites), communityId) : Promise.resolve(notConfigured()),
  };
}
