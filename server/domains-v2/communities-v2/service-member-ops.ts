/**
 * communities-v2 — membership / join-request operation bodies (internal). The
 * service factory keeps the wiring; these functions hold the per-operation
 * logic so service.ts stays under the backend service size budget.
 */
import type {
  ChangeMemberRoleInput,
  CommunityJoinRequestDTO,
  CommunityMemberDTO,
  CommunityViewerStateDTO,
  DecideJoinRequestInput,
} from "./dto";
import type {
  CommunityRepository,
  JoinRequestRepository,
  MembershipRepository,
} from "./ports";
import {
  canCancelOwnJoinRequest,
  canChangeRole,
  canLeaveCommunity,
  canManageMembers,
  hasCommunityAuthority,
} from "./policy";

type Clock = { now: () => Date };
type IdGen = { next: () => string };

export type MemberOpsDeps = {
  communities: CommunityRepository;
  members: MembershipRepository;
  joinRequests: JoinRequestRepository;
  clock: Clock;
  ids?: IdGen;
};

export type MemberOpsErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "JOIN_REQUEST_NOT_PENDING"
  | "MEMBER_NOT_FOUND"
  | "FOUNDER_PROTECTED"
  | "ALREADY_MEMBER"
  | "JOIN_REQUIRES_APPROVAL"
  | "FOUNDER_CANNOT_LEAVE"
  | "NOT_MEMBER";

export type MemberOpsResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: MemberOpsErrorCode; message: string } };

async function roleOf(deps: MemberOpsDeps, communityId: string, userId: string) {
  return (await deps.members.get(communityId, userId))?.role ?? null;
}

export async function decideJoinRequest(
  deps: MemberOpsDeps,
  input: DecideJoinRequestInput,
  nextStatus: "accepted" | "rejected",
): Promise<MemberOpsResult<CommunityJoinRequestDTO>> {
  if (!(await deps.communities.getById(input.communityId))) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
  }
  if (!canManageMembers(await roleOf(deps, input.communityId, input.actorUserId))) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Only founder/admin may decide join requests." } };
  }
  const pending = await deps.joinRequests.getById(input.joinRequestId);
  if (!pending || pending.communityId !== input.communityId) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Join request not found." } };
  }
  if (pending.status !== "pending") {
    return { ok: false, error: { code: "JOIN_REQUEST_NOT_PENDING", message: "Join request already decided." } };
  }
  const updated = await deps.joinRequests.update(pending.id, { status: nextStatus });
  if (nextStatus === "accepted") {
    const existing = await deps.members.get(input.communityId, pending.requesterUserId);
    if (!existing) {
      await deps.members.add({
        communityId: input.communityId,
        userId: pending.requesterUserId,
        role: "member",
        status: "active",
        joinedAt: deps.clock.now().toISOString(),
      });
    }
  }
  return { ok: true, value: updated };
}

export async function listPendingJoinRequests(
  deps: MemberOpsDeps,
  communityId: string,
  actorUserId: string,
): Promise<MemberOpsResult<CommunityJoinRequestDTO[]>> {
  if (!(await deps.communities.getById(communityId))) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
  }
  if (!canManageMembers(await roleOf(deps, communityId, actorUserId))) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Only founder/admin may list join requests." } };
  }
  return { ok: true, value: await deps.joinRequests.listPending(communityId) };
}

export async function listMembers(
  deps: MemberOpsDeps,
  communityId: string,
  actorUserId: string,
): Promise<MemberOpsResult<CommunityMemberDTO[]>> {
  if (!(await deps.communities.getById(communityId))) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
  }
  const actorRole = await roleOf(deps, communityId, actorUserId);
  if (!actorRole) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Only community members may list members." } };
  }
  return { ok: true, value: [...(await deps.members.listForCommunity(communityId))] };
}

export async function changeMemberRole(
  deps: MemberOpsDeps,
  input: ChangeMemberRoleInput,
): Promise<MemberOpsResult<CommunityMemberDTO>> {
  if (!(await deps.communities.getById(input.communityId))) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
  }
  const target = await deps.members.get(input.communityId, input.targetUserId);
  if (!target) {
    return { ok: false, error: { code: "MEMBER_NOT_FOUND", message: "Target user is not a community member." } };
  }
  if (target.role === "founder") {
    return { ok: false, error: { code: "FOUNDER_PROTECTED", message: "Founder role cannot be reassigned." } };
  }
  if (!canChangeRole(await roleOf(deps, input.communityId, input.actorUserId), target.role, input.nextRole)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Actor cannot perform this role change." } };
  }
  return { ok: true, value: { ...(await deps.members.updateRole(input.communityId, input.targetUserId, input.nextRole)) } };
}

/**
 * Direct join for a public community. For private communities the caller must
 * route through `requestJoin` instead — joinCommunity returns JOIN_REQUIRES_APPROVAL.
 */
export async function joinCommunity(
  deps: MemberOpsDeps,
  communityId: string,
  userId: string,
): Promise<MemberOpsResult<CommunityMemberDTO>> {
  const community = await deps.communities.getById(communityId);
  if (!community) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
  }
  if (community.visibility !== "public") {
    return { ok: false, error: { code: "JOIN_REQUIRES_APPROVAL", message: "This community is not open — request to join instead." } };
  }
  const existing = await deps.members.get(communityId, userId);
  if (existing) {
    return { ok: false, error: { code: "ALREADY_MEMBER", message: "You are already a member of this community." } };
  }
  const record: CommunityMemberDTO = {
    communityId,
    userId,
    role: "member",
    status: "active",
    joinedAt: deps.clock.now().toISOString(),
  };
  await deps.members.add(record);
  return { ok: true, value: record };
}

/**
 * Cancel the actor's own pending join request. Other users (including
 * founders/admins) must reject via `rejectJoinRequest`, not cancel.
 */
export async function cancelJoinRequest(
  deps: MemberOpsDeps,
  actorUserId: string,
  communityId: string,
  joinRequestId: string,
): Promise<MemberOpsResult<CommunityJoinRequestDTO>> {
  if (!(await deps.communities.getById(communityId))) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
  }
  const request = await deps.joinRequests.getById(joinRequestId);
  if (!request || request.communityId !== communityId) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Join request not found." } };
  }
  if (!canCancelOwnJoinRequest(actorUserId, request.requesterUserId)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Only the requester may cancel their join request." } };
  }
  if (request.status !== "pending") {
    return { ok: false, error: { code: "JOIN_REQUEST_NOT_PENDING", message: "Join request already decided." } };
  }
  return { ok: true, value: await deps.joinRequests.update(request.id, { status: "cancelled" }) };
}

/**
 * Leave a community. Members/moderators/admins can leave freely. A founder may
 * leave only when another founder exists — otherwise FOUNDER_CANNOT_LEAVE.
 */
export async function leaveCommunity(
  deps: MemberOpsDeps,
  communityId: string,
  userId: string,
): Promise<MemberOpsResult<true>> {
  if (!(await deps.communities.getById(communityId))) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
  }
  const membership = await deps.members.get(communityId, userId);
  if (!membership) {
    return { ok: false, error: { code: "NOT_MEMBER", message: "You are not a member of this community." } };
  }
  // SCALABILITY_HOT_PATH_EXCEPTION: founder count is bounded per community; single bounded read, no broadcast.
  const founders = (await deps.members.listForCommunity(communityId)).filter((m) => m.role === "founder");
  const remainingFounders = membership.role === "founder" ? founders.length - 1 : founders.length;
  if (!canLeaveCommunity(membership.role, remainingFounders)) {
    return {
      ok: false,
      error: { code: "FOUNDER_CANNOT_LEAVE", message: "Last founder cannot leave; transfer ownership first." },
    };
  }
  await deps.members.remove(communityId, userId);
  return { ok: true, value: true };
}

/** Derive viewer state without exposing raw membership records or PII. */
export async function getViewerState(
  deps: MemberOpsDeps,
  communityId: string,
  viewerUserId: string | null,
): Promise<MemberOpsResult<CommunityViewerStateDTO>> {
  const community = await deps.communities.getById(communityId);
  if (!community) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
  }
  if (!viewerUserId) {
    return {
      ok: true,
      value: {
        viewerUserId: null,
        relation: "unauthenticated",
        canJoin: false,
        canRequestJoin: false,
        canCancelRequest: false,
        canLeave: false,
        canManage: false,
        canViewPrivateSections: community.visibility === "public",
      },
    };
  }
  const membership = await deps.members.get(communityId, viewerUserId);
  const pending = await deps.joinRequests.findPending(communityId, viewerUserId);
  if (membership) {
    return {
      ok: true,
      value: {
        viewerUserId,
        relation: membership.role,
        canJoin: false,
        canRequestJoin: false,
        canCancelRequest: false,
        canLeave: true, // service guards last-founder rule at the leave call site
        canManage: hasCommunityAuthority(membership.role),
        canViewPrivateSections: true,
      },
    };
  }
  return {
    ok: true,
    value: {
      viewerUserId,
      relation: pending ? "pending_request" : "stranger",
      canJoin: !pending && community.visibility === "public",
      canRequestJoin: !pending && community.visibility !== "public",
      canCancelRequest: !!pending,
      canLeave: false,
      canManage: false,
      canViewPrivateSections: community.visibility === "public",
    },
  };
}
