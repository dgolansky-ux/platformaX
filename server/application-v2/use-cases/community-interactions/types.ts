/**
 * application-v2/use-cases/community-interactions — command/result types
 * (Slice 6). The orchestrator gates comments + reactions against the feed
 * item's community + feedType visibility, then delegates persistence to
 * content-v2 comments/reactions services.
 */
import type {
  CommentDTO,
  ReactionSummaryDTO,
  ReactionTargetType,
  ReactionType,
  ViewerReactionStateDTO,
} from "@server/domains-v2/content-v2/public-api";

export type CommunityInteractionsErrorCode =
  | "NOT_FOUND"
  | "FEED_ITEM_NOT_FOUND"
  | "FORBIDDEN"
  | "EMPTY_BODY"
  | "BODY_TOO_LONG"
  | "INVALID_REACTION_TYPE"
  | "FORBIDDEN_AUTHOR_ONLY"
  | "ALREADY_DELETED"
  | "PARENT_NOT_FOUND"
  | "COMMENT_NOT_FOUND";

export type CommunityInteractionsResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: CommunityInteractionsErrorCode; message: string } };

export type CreateCommunityPostCommentCommand = {
  actorUserId: string;
  feedItemId: string;
  body: string;
  parentCommentId?: string | null;
};

export type UpdateCommunityCommentCommand = {
  actorUserId: string;
  feedItemId: string;
  commentId: string;
  body: string;
};

export type DeleteCommunityCommentCommand = {
  actorUserId: string;
  feedItemId: string;
  commentId: string;
};

export type ListCommunityPostCommentsQuery = {
  actorUserId: string;
  feedItemId: string;
  cursor?: string | null;
  limit?: number;
};

export type ReactToCommunityPostCommand = {
  actorUserId: string;
  feedItemId: string;
  reactionType: ReactionType;
  /** `set` adds, `remove` removes, `toggle` flips. */
  mode: "set" | "remove" | "toggle";
};

export type ReactToCommunityCommentCommand = {
  actorUserId: string;
  feedItemId: string;
  commentId: string;
  reactionType: ReactionType;
  mode: "set" | "remove" | "toggle";
};

export type CommunityPostInteractionSummaryQuery = {
  actorUserId: string;
  feedItemIds: readonly string[];
};

export type CommunityCommentInteractionSummaryDTO = {
  commentId: string;
  reactions: ReactionSummaryDTO;
  viewer: ViewerReactionStateDTO;
};

export type CommunityPostInteractionSummaryDTO = {
  feedItemId: string;
  commentCount: number;
  reactions: ReactionSummaryDTO;
  viewer: ViewerReactionStateDTO;
};

export type ReactToCommunityPostResult = {
  active: boolean;
  reactions: ReactionSummaryDTO;
  viewer: ViewerReactionStateDTO;
};

export type ReactToCommunityCommentResult = {
  active: boolean;
  reactions: ReactionSummaryDTO;
  viewer: ViewerReactionStateDTO;
};

export type ListCommunityPostCommentsResultDTO = {
  items: readonly CommentDTO[];
  nextCursor: string | null;
  /** Reaction summaries + viewer state, per-comment, in the same order as items. */
  reactions: readonly CommunityCommentInteractionSummaryDTO[];
};

export type ReactionTargetTypePublic = ReactionTargetType;
