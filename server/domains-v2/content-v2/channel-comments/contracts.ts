// === Slice 25 PRE-runtime ACK markers (EXC-016) =====================
// PX-CTX-001-ACK: pre-runtime content/feed DTO; explicit owner/ref context fields scheduled with content read-model slice. EXC-016.
// === end Slice 25 ACK markers =======================================

import type { ChannelCommentDTO, ChannelCommentListDTO } from "./dto";

export type ChannelCommentErrorCode =
  | "EMPTY_BODY"
  | "BODY_TOO_LONG"
  | "COMMENT_NOT_FOUND"
  | "PARENT_NOT_FOUND"
  | "FORBIDDEN"
  | "ALREADY_DEACTIVATED";

export type ChannelCommentResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ChannelCommentErrorCode; message: string } };

export type ChannelCommentCreatedValue = { comment: ChannelCommentDTO };
export type ChannelCommentUpdatedValue = { comment: ChannelCommentDTO };
export type ChannelCommentDeactivatedValue = { comment: ChannelCommentDTO };
export type ChannelCommentListValue = ChannelCommentListDTO;
