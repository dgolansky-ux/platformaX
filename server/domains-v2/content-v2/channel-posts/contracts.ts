// === Slice 25 PRE-runtime ACK markers (EXC-016) =====================
// PX-CTX-001-ACK: pre-runtime content/feed DTO; explicit owner/ref context fields scheduled with content read-model slice. EXC-016.
// === end Slice 25 ACK markers =======================================

import type { ChannelFeedItemDTO, ChannelPostDTO } from "./dto";

export type ChannelPostErrorCode =
  | "EMPTY_BODY"
  | "BODY_TOO_LONG"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "DEACTIVATED";

export type ChannelPostResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ChannelPostErrorCode; message: string } };

export type ChannelFeedPage = {
  pinnedPost: ChannelFeedItemDTO | null;
  items: readonly ChannelFeedItemDTO[];
  nextCursor: string | null;
};

export type ChannelPostCreatedValue = { post: ChannelPostDTO };
export type ChannelPostUpdatedValue = { post: ChannelPostDTO };
export type ChannelPostDeactivatedValue = { postId: string; deactivated: true };
