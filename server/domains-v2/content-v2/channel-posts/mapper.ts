import type { ChannelFeedItemDTO, ChannelPostDTO } from "./dto";
import type { ChannelPostRecord } from "./ports";

export function toChannelPostDTO(r: ChannelPostRecord): ChannelPostDTO {
  return {
    id: r.id,
    channelId: r.channelId,
    authorUserId: r.authorUserId,
    body: r.body,
    mediaRefs: r.mediaRefs,
    status: r.status,
    pinned: r.pinned,
    pinnedAt: r.pinnedAt,
    pinnedByUserId: r.pinnedByUserId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    deletedAt: r.deletedAt,
  };
}

export function toChannelFeedItemDTO(r: ChannelPostRecord): ChannelFeedItemDTO {
  return {
    postId: r.id,
    channelId: r.channelId,
    authorUserId: r.authorUserId,
    body: r.body,
    mediaRefs: r.mediaRefs,
    pinned: r.pinned,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
