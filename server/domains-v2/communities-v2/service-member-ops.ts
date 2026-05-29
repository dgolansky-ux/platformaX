/**
 * communities-v2 — membership / join-request operation bodies (internal). The
 * service factory keeps the wiring; these functions hold the per-operation
 * logic so service.ts stays under the backend service size budget.
 */
import type {
  ChangeMemberRoleInput,
  CommunityJoinRequestDTO,
  CommunityMemberDTO,
  DecideJoinRequestInput,
} from "./dto";
import type {
  CommunityRepository,
  JoinRequestRepository,
  MembershipRepository,
} from "./ports";
import { canChangeRole, canManageMembers } from "./policy";

type Clock = { now: () => Date };

export type MemberOpsDeps = {
  communities: CommunityRepository;
  members: MembershipRepository;
  joinRequests: JoinRequestRepository;
  clock: Clock;
};

export type MemberOpsErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "JOIN_REQUEST_NOT_PENDING"
  | "MEMBER_NOT_FOUND"
  | "FOUNDER_PROTECTED";

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
