// === Slice 25 PRE-runtime ACK markers (EXC-016) =====================
// PX-CTX-001-ACK: pre-runtime content/feed DTO; explicit owner/ref context fields scheduled with content read-model slice. EXC-016.
// === end Slice 25 ACK markers =======================================

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
