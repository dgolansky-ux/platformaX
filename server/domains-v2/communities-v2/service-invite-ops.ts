/**
 * communities-v2 — invite operations (internal). Held in a sibling file so
 * service.ts stays under the backend service size budget.
 *
 * Invites are a foundation in Slice 3 — there is no email delivery and no
 * `acceptInvite` flow yet. The repository, policy and DTOs are wired so the
 * UI can render lists and create/cancel records truthfully.
 */
import type {
  CancelCommunityInviteInput,
  CommunityInviteManageDTO,
  CommunityInvitePublicDTO,
  CreateCommunityInviteInput,
} from "./dto";
import type { CommunityRepository, InviteRecord, InviteRepository, MembershipRepository } from "./ports";
import { canManageInvites } from "./policy";

type Clock = { now: () => Date };
type IdGen = { next: () => string };

export type InviteOpsDeps = {
  communities: CommunityRepository;
  members: MembershipRepository;
  invites: InviteRepository;
  clock: Clock;
  ids: IdGen;
};

export type InviteOpsErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INVITE_TARGET_REQUIRED"
  | "INVITE_DUPLICATE"
  | "INVITE_NOT_PENDING";

export type InviteOpsResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: InviteOpsErrorCode; message: string } };

async function roleOf(deps: InviteOpsDeps, communityId: string, userId: string) {
  return (await deps.members.get(communityId, userId))?.role ?? null;
}

function toPublic(r: InviteRecord): CommunityInvitePublicDTO {
  return {
    id: r.id,
    communityId: r.communityId,
    inviterUserId: r.inviterUserId,
    invitedUserId: r.invitedUserId,
    status: r.status,
    createdAt: r.createdAt,
  };
}

function toManage(r: InviteRecord): CommunityInviteManageDTO {
  return { ...toPublic(r), invitedEmail: r.invitedEmail };
}

export async function createInvite(
  deps: InviteOpsDeps,
  input: CreateCommunityInviteInput,
): Promise<InviteOpsResult<CommunityInviteManageDTO>> {
  if (!(await deps.communities.getById(input.communityId))) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
  }
  if (!canManageInvites(await roleOf(deps, input.communityId, input.actorUserId))) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Only founder/admin may create invites." } };
  }
  const userId = input.invitedUserId ?? null;
  const email = input.invitedEmail ?? null;
  if (!userId && !email) {
    return { ok: false, error: { code: "INVITE_TARGET_REQUIRED", message: "Invite needs a user id or an email." } };
  }
  const duplicate = await deps.invites.findPendingForTarget(input.communityId, userId, email);
  if (duplicate) {
    return { ok: false, error: { code: "INVITE_DUPLICATE", message: "Pending invite already exists for this target." } };
  }
  const created = await deps.invites.add({
    id: deps.ids.next(),
    communityId: input.communityId,
    inviterUserId: input.actorUserId,
    invitedUserId: userId,
    invitedEmail: email,
    status: "pending",
    createdAt: deps.clock.now().toISOString(),
    expiresAt: null,
  });
  return { ok: true, value: toManage(created) };
}

export async function cancelInvite(
  deps: InviteOpsDeps,
  input: CancelCommunityInviteInput,
): Promise<InviteOpsResult<CommunityInviteManageDTO>> {
  if (!(await deps.communities.getById(input.communityId))) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
  }
  if (!canManageInvites(await roleOf(deps, input.communityId, input.actorUserId))) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Only founder/admin may cancel invites." } };
  }
  const invite = await deps.invites.getById(input.inviteId);
  if (!invite || invite.communityId !== input.communityId) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Invite not found." } };
  }
  if (invite.status !== "pending") {
    return { ok: false, error: { code: "INVITE_NOT_PENDING", message: "Invite already finalised." } };
  }
  const updated = await deps.invites.update(invite.id, { status: "cancelled" });
  return { ok: true, value: toManage(updated) };
}

export async function listInvitesForManage(
  deps: InviteOpsDeps,
  communityId: string,
  actorUserId: string,
): Promise<InviteOpsResult<CommunityInviteManageDTO[]>> {
  if (!(await deps.communities.getById(communityId))) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
  }
  if (!canManageInvites(await roleOf(deps, communityId, actorUserId))) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Only founder/admin may list invites." } };
  }
  // SCALABILITY_EXCEPTION: bounded read for a single community (capped UI list), not a broadcast.
  return { ok: true, value: (await deps.invites.listForCommunity(communityId)).map(toManage) };
}

export async function listInvitesPublic(
  deps: InviteOpsDeps,
  communityId: string,
): Promise<InviteOpsResult<CommunityInvitePublicDTO[]>> {
  if (!(await deps.communities.getById(communityId))) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
  }
  return { ok: true, value: (await deps.invites.listForCommunity(communityId)).map(toPublic) };
}
