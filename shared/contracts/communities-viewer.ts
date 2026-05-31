/**
 * shared/contracts/communities-viewer — viewer-state + management DTOs derived
 * from the domain. Kept in a sibling file so the public-surface export budget
 * on `communities.ts` stays bounded.
 *
 * privacy classification: viewer/public DTOs carry no PII; the manage DTO
 * may carry `invitedEmail`, and is only ever rendered behind a founder/admin
 * guard by the manage view.
 */
import type {
  CommunityJoinRequestSummaryDTO,
  CommunityMemberSummaryDTO,
  CommunityProfileDTO,
  CommunityViewerRelation,
} from "./communities";

export type CommunityViewerStateDTO = {
  viewerUserId: string | null;
  relation: CommunityViewerRelation;
  canJoin: boolean;
  canRequestJoin: boolean;
  canCancelRequest: boolean;
  pendingJoinRequestId: string | null;
  canLeave: boolean;
  canManage: boolean;
  canViewPrivateSections: boolean;
};

export type CommunityProfileViewDTO = {
  profile: CommunityProfileDTO;
  viewer: CommunityViewerStateDTO;
};

export type CommunityInviteStatus = "pending" | "accepted" | "cancelled" | "expired";

export type CommunityInviteSummaryDTO = {
  id: string;
  inviterUserId: string;
  invitedUserId: string | null;
  /** Only filled in the manage DTO (founder/admin); never in public lists. */
  invitedEmail: string | null;
  status: CommunityInviteStatus;
  createdAt: string;
};

export type CommunityManageViewDTO = {
  profile: CommunityProfileDTO;
  viewer: CommunityViewerStateDTO;
  members: readonly CommunityMemberSummaryDTO[];
  joinRequests: readonly CommunityJoinRequestSummaryDTO[];
  invites: readonly CommunityInviteSummaryDTO[];
};

export type CreateCommunityInviteFrontendInput = {
  slug: string;
  invitedUserId?: string;
  invitedEmail?: string;
};
