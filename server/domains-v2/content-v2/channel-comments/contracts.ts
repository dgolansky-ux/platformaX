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
