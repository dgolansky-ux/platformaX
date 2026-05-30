import type { ChannelCommentDTO } from "./dto";
import type { ChannelCommentRecord } from "./repository";

export const DEACTIVATED_CHANNEL_COMMENT_BODY = "";

export function toChannelCommentDTO(record: ChannelCommentRecord): ChannelCommentDTO {
  return {
    id: record.id,
    channelPostId: record.channelPostId,
    parentCommentId: record.parentCommentId,
    authorUserId: record.authorUserId,
    body: record.status === "deactivated" ? DEACTIVATED_CHANNEL_COMMENT_BODY : record.body,
    status: record.status,
    moderationReason: record.moderationReason,
    moderatedByUserId: record.moderatedByUserId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
  };
}
