// === Slice 25 PRE-runtime ACK markers (EXC-016) =====================
// PX-CTX-001-ACK: pre-runtime content/feed DTO; explicit owner/ref context fields scheduled with content read-model slice. EXC-016.
// === end Slice 25 ACK markers =======================================

/**
 * content-v2 / reactions — DTOs + inputs for reactions on community feed items
 * and comments (Slice 6). Reactions are anchored to a target (post-feed-item
 * or comment), not to a global postId — same rationale as comments: each
 * propagated copy keeps its own interactions LOCAL.
 *
 * MVP enum: `like` only (legacy parity). Wider emoji set deferred. content-v2
 * owns reactions only; community visibility is enforced by application-v2.
 *
 * privacy classification: Public DTO — references userId only, never PII.
 */

export type ReactionTargetType = "post" | "comment";

export type ReactionType = "like";

export const REACTION_TYPES: readonly ReactionType[] = ["like"];

export type ReactionDTO = {
  id: string;
  targetType: ReactionTargetType;
  targetId: string;
  userId: string;
  reactionType: ReactionType;
  createdAt: string;
};

export type ReactionTargetRef = {
  targetType: ReactionTargetType;
  targetId: string;
};

export type ReactionSummaryDTO = ReactionTargetRef & {
  counts: Readonly<Record<ReactionType, number>>;
  total: number;
};

export type ViewerReactionStateDTO = ReactionTargetRef & {
  active: readonly ReactionType[];
};

export type SetReactionInput = ReactionTargetRef & {
  userId: string;
  reactionType: ReactionType;
};

export type RemoveReactionInput = ReactionTargetRef & {
  userId: string;
  reactionType: ReactionType;
};

export type ToggleReactionInput = ReactionTargetRef & {
  userId: string;
  reactionType: ReactionType;
};

export type SummaryQuery = {
  targets: readonly ReactionTargetRef[];
};

export type ViewerStateQuery = {
  userId: string;
  targets: readonly ReactionTargetRef[];
};
