// === Slice 25 PRE-runtime ACK markers (EXC-016) =====================
// PX-CTX-001-ACK: pre-runtime content/feed DTO; explicit owner/ref context fields scheduled with content read-model slice. EXC-016.
// === end Slice 25 ACK markers =======================================

/**
 * content-v2 / reactions — public contracts (Slice 6). Result + error code
 * shape shared with application-v2 orchestration.
 */
import type { ReactionDTO, ReactionSummaryDTO, ReactionType, ViewerReactionStateDTO } from "./dto";

export type ReactionErrorCode = "INVALID_REACTION_TYPE" | "NOT_FOUND";

export type ReactionResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ReactionErrorCode; message: string } };

export type SetReactionValue = { reaction: ReactionDTO; created: boolean };
export type RemoveReactionValue = { removed: boolean };
export type ToggleReactionValue = { active: boolean; reaction: ReactionDTO | null };
export type SummaryValue = { summaries: readonly ReactionSummaryDTO[] };
export type ViewerStateValue = { states: readonly ViewerReactionStateDTO[] };

export type { ReactionType };
