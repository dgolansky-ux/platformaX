/**
 * shared/contracts/community-interactions — frontend-facing DTOs + inputs for
 * comments + reactions under community feed items (Slice 6).
 *
 * privacy classification: Public DTO — references userId only, never PII.
 */
import type { CommunityActionResult } from "./communities";

export type CommunityReactionType = "like";

export const COMMUNITY_REACTION_TYPES: readonly CommunityReactionType[] = ["like"];

export type CommunityCommentStatus = "active" | "deleted";

export type CommunityCommentDTO = {
  id: string;
  feedItemId: string;
  parentCommentId: string | null;
  authorUserId: string;
  authorDisplayName: string;
  body: string;
  status: CommunityCommentStatus;
  createdAt: string;
  updatedAt: string;
  /** Set when the viewer is the author — UI shows edit/delete affordance. */
  viewerIsAuthor: boolean;
};

export type CommunityReactionCountsDTO = Readonly<Record<CommunityReactionType, number>>;

export type CommunityReactionSummaryDTO = {
  counts: CommunityReactionCountsDTO;
  total: number;
  /** Reactions the current viewer has set on this target. */
  viewerActive: readonly CommunityReactionType[];
};

export type CommunityPostInteractionDTO = {
  feedItemId: string;
  commentCount: number;
  reactions: CommunityReactionSummaryDTO;
};

export type CommunityCommentInteractionDTO = {
  commentId: string;
  reactions: CommunityReactionSummaryDTO;
};

export type CommunityCommentsPageDTO = {
  items: readonly CommunityCommentDTO[];
  nextCursor: string | null;
  reactions: readonly CommunityCommentInteractionDTO[];
};

export type CreateCommunityCommentFrontendInput = {
  feedItemId: string;
  body: string;
  parentCommentId?: string | null;
};

export type UpdateCommunityCommentFrontendInput = {
  feedItemId: string;
  commentId: string;
  body: string;
};

export type DeleteCommunityCommentFrontendInput = {
  feedItemId: string;
  commentId: string;
};

export type ReactToCommunityPostFrontendInput = {
  feedItemId: string;
  reactionType: CommunityReactionType;
  mode: "set" | "remove" | "toggle";
};

export type ReactToCommunityCommentFrontendInput = {
  feedItemId: string;
  commentId: string;
  reactionType: CommunityReactionType;
  mode: "set" | "remove" | "toggle";
};

export type CommunityInteractionActionResult<T> = CommunityActionResult<T>;
