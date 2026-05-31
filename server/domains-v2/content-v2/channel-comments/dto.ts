// === Slice 25 PRE-runtime ACK markers (EXC-016) =====================
// PX-CTX-001-ACK: pre-runtime content/feed DTO; explicit owner/ref context fields scheduled with content read-model slice. EXC-016.
// === end Slice 25 ACK markers =======================================

/**
 * content-v2/channel-comments — comments under channel posts.
 *
 * Public DTOs expose only user ids and public author summaries supplied by
 * application-v2. Deactivated comments never expose their original body.
 */
export type ChannelCommentStatus = "active" | "edited" | "deactivated";

export type ChannelCommentAuthorPublicSummaryDTO = {
  userId: string;
  displayName: string;
  handle: string | null;
  avatarRef: string | null;
};

export type ChannelCommentDTO = {
  id: string;
  channelPostId: string;
  parentCommentId: string | null;
  authorUserId: string;
  body: string;
  status: ChannelCommentStatus;
  moderationReason?: string;
  moderatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type ChannelCommentListDTO = {
  items: readonly ChannelCommentDTO[];
  nextCursor: string | null;
};

export type CreateChannelCommentInput = {
  channelPostId: string;
  authorUserId: string;
  body: string;
  parentCommentId?: string | null;
};

export type UpdateChannelCommentInput = {
  commentId: string;
  actorUserId: string;
  body: string;
  canModerate?: boolean;
};

export type DeactivateChannelCommentInput = {
  commentId: string;
  actorUserId: string;
  moderationReason?: string;
  canModerate?: boolean;
};

export type ListChannelCommentsQuery = {
  channelPostId: string;
  cursor?: string | null;
  limit?: number;
};
