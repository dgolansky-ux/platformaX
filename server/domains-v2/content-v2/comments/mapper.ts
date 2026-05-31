/**
 * content-v2 / comments — mapper boundary. Soft-deleted comments expose a
 * placeholder body so the thread keeps its order without leaking the original
 * content. Only fields necessary for the public DTO are returned.
 */
import type { CommentDTO } from "./dto";
import type { CommentRecord } from "./ports";

export const DELETED_BODY_PLACEHOLDER = "";

export function toCommentDTO(record: CommentRecord): CommentDTO {
  return {
    id: record.id,
    feedItemId: record.feedItemId,
    parentCommentId: record.parentCommentId,
    authorUserId: record.authorUserId,
    body: record.status === "deleted" ? DELETED_BODY_PLACEHOLDER : record.body,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
