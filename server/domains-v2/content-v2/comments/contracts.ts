/**
 * content-v2 / comments — public contracts (Slice 6). Result + error code shape
 * shared with application-v2 orchestration.
 */
import type { CommentDTO, CommentListDTO } from "./dto";

export type CommentErrorCode =
  | "EMPTY_BODY"
  | "BODY_TOO_LONG"
  | "COMMENT_NOT_FOUND"
  | "FORBIDDEN_AUTHOR_ONLY"
  | "ALREADY_DELETED"
  | "PARENT_NOT_FOUND";

export type CommentResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: CommentErrorCode; message: string } };

export type CommentCreatedValue = { comment: CommentDTO };
export type CommentUpdatedValue = { comment: CommentDTO };
export type CommentDeletedValue = { comment: CommentDTO };
export type CommentListValue = CommentListDTO;
