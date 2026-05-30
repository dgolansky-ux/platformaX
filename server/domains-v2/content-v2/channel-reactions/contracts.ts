import type { ChannelReactionDTO, ChannelReactionSummaryDTO, ChannelViewerReactionStateDTO } from "./dto";

export type ChannelReactionErrorCode = "INVALID_REACTION_TYPE";

export type ChannelReactionResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ChannelReactionErrorCode; message: string } };

export type SetChannelReactionValue = { reaction: ChannelReactionDTO; created: boolean };
export type RemoveChannelReactionValue = { removed: boolean };
export type ToggleChannelReactionValue = { active: boolean; reaction: ChannelReactionDTO | null };
export type ChannelReactionSummaryValue = { summaries: readonly ChannelReactionSummaryDTO[] };
export type ChannelViewerReactionStateValue = { states: readonly ChannelViewerReactionStateDTO[] };
