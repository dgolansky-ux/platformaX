/**
 * shared/contracts/communities-viewer — viewer-state DTOs derived from the
 * domain. Kept in a sibling file so the public-surface export budget on
 * `communities.ts` stays bounded.
 *
 * privacy classification: Public DTO — booleans + ids only, no PII.
 */
import type { CommunityProfileDTO, CommunityViewerRelation } from "./communities";

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
