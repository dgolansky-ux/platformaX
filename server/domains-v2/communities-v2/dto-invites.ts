/**
 * communities-v2 — invite + viewer DTOs.
 *
 * Held in a sibling module so dto.ts stays under the public-surface export
 * budget. Public DTO never carries the invited email; manage DTO can. Viewer
 * state carries booleans only.
 */
export type { CommunityViewerRelation, CommunityViewerStateDTO } from "./dto-viewer";

export type CommunityInviteStatus = "pending" | "accepted" | "cancelled" | "expired";

export type CommunityInvitePublicDTO = {
  id: string;
  communityId: string;
  inviterUserId: string;
  invitedUserId: string | null;
  status: CommunityInviteStatus;
  createdAt: string;
};

export type CommunityInviteManageDTO = CommunityInvitePublicDTO & {
  invitedEmail: string | null;
};

export type CreateCommunityInviteInput = {
  actorUserId: string;
  communityId: string;
  invitedUserId?: string;
  invitedEmail?: string;
};

export type CancelCommunityInviteInput = {
  actorUserId: string;
  communityId: string;
  inviteId: string;
};
