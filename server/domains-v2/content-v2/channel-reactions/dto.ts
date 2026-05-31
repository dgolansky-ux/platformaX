// === Slice 25 PRE-runtime ACK markers (EXC-016) =====================
// PX-CTX-001-ACK: pre-runtime content/feed DTO; explicit owner/ref context fields scheduled with content read-model slice. EXC-016.
// === end Slice 25 ACK markers =======================================

/**
 * content-v2/channel-reactions — reactions on channel posts and comments.
 * MVP supports `like` only.
 *
 * privacy classification: Public DTO — references userId and target ids only,
 * never email, phone or private contact fields.
 */
export type ChannelReactionTargetType = "channel_post" | "channel_comment";
export type ChannelReactionType = "like";

export const CHANNEL_REACTION_TYPES: readonly ChannelReactionType[] = ["like"];

export type ChannelReactionDTO = {
  id: string;
  targetType: ChannelReactionTargetType;
  targetId: string;
  userId: string;
  reactionType: ChannelReactionType;
  createdAt: string;
  updatedAt: string;
};

export type ChannelReactionTargetRef = {
  targetType: ChannelReactionTargetType;
  targetId: string;
};

export type ChannelReactionSummaryDTO = ChannelReactionTargetRef & {
  counts: Readonly<Record<ChannelReactionType, number>>;
  total: number;
};

export type ChannelViewerReactionStateDTO = ChannelReactionTargetRef & {
  active: readonly ChannelReactionType[];
};

export type SetChannelReactionInput = ChannelReactionTargetRef & {
  userId: string;
  reactionType: ChannelReactionType;
};

export type RemoveChannelReactionInput = SetChannelReactionInput;
export type ToggleChannelReactionInput = SetChannelReactionInput;

export type ChannelReactionSummaryQuery = {
  targets: readonly ChannelReactionTargetRef[];
};

export type ChannelViewerReactionStateQuery = ChannelReactionSummaryQuery & {
  userId: string;
};
