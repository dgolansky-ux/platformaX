/**
 * content-v2 / comments — DTOs + inputs for comments under community feed items
 * (Slice 6). Comments are anchored to `feedItemId` (not the source post) so
 * propagated copies in descendant communities keep their interactions LOCAL —
 * a staff_only post propagated down does not leak comments into a sibling
 * community's view. content-v2 owns comments only; community visibility is
 * enforced by application-v2.
 *
 * privacy classification: Public DTO — references author by userId only, never
 * PII (no email/phone). `body` is comment content; soft-deleted body is
 * stripped at the mapper boundary.
 */

export type CommentStatus = "active" | "deleted";

export type CommentDTO = {
  id: string;
  feedItemId: string;
  parentCommentId: string | null;
  authorUserId: string;
  body: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
};

export type CommentAuthorPublicSummaryDTO = {
  userId: string;
  displayName: string;
};

export type CommentListDTO = {
  items: readonly CommentDTO[];
  nextCursor: string | null;
};

export type CreateCommentInput = {
  feedItemId: string;
  authorUserId: string;
  body: string;
  parentCommentId?: string | null;
};

export type UpdateCommentInput = {
  commentId: string;
  actorUserId: string;
  body: string;
};

export type DeleteCommentInput = {
  commentId: string;
  actorUserId: string;
};

export type ListCommentsQuery = {
  feedItemId: string;
  cursor?: string | null;
  limit?: number;
};

export type CountCommentsQuery = {
  feedItemId: string;
};
