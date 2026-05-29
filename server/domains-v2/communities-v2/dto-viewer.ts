/**
 * communities-v2 — viewer-state DTO + relation enum.
 *
 * privacy classification: Public DTO — booleans + viewer ref only, no PII.
 * Held in a sibling module so dto.ts stays under the public-surface export
 * budget.
 */

export type CommunityViewerRelation =
  | "unauthenticated"
  | "stranger"
  | "pending_request"
  | "member"
  | "moderator"
  | "admin"
  | "founder";

export type CommunityViewerStateDTO = {
  viewerUserId: string | null;
  relation: CommunityViewerRelation;
  canJoin: boolean;
  canRequestJoin: boolean;
  canCancelRequest: boolean;
  canLeave: boolean;
  canManage: boolean;
  canViewPrivateSections: boolean;
};
