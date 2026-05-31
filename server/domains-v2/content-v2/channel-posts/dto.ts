// === Slice 25 PRE-runtime ACK markers (EXC-016) =====================
// PX-CTX-001-ACK: pre-runtime content/feed DTO; explicit owner/ref context fields scheduled with content read-model slice. EXC-016.
// === end Slice 25 ACK markers =======================================

/**
 * content-v2/channel-posts — channel post DTOs.
 *
 * privacy classification: Public DTO. Author/channel references are ids or
 * public summaries supplied by the application layer; no email/phone/private
 * contact data and no raw storage paths.
 */

export type ChannelPostStatus = "draft" | "published" | "edited" | "deactivated";

export type ChannelPostDTO = {
  id: string;
  channelId: string;
  authorUserId: string;
  body: string;
  mediaRefs: readonly string[];
  status: ChannelPostStatus;
  pinned: boolean;
  pinnedAt?: string;
  pinnedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type ChannelFeedItemDTO = {
  postId: string;
  channelId: string;
  authorUserId: string;
  body: string;
  mediaRefs: readonly string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateChannelPostInput = {
  channelId: string;
  authorUserId: string;
  body: string;
  mediaRefs?: readonly string[];
};

export type UpdateChannelPostInput = {
  postId: string;
  actorUserId: string;
  body: string;
  mediaRefs?: readonly string[];
  canManage: boolean;
};

export type DeactivateChannelPostInput = {
  postId: string;
  actorUserId: string;
  canManage: boolean;
};

export type PinChannelPostInput = {
  postId: string;
  actorUserId: string;
};

export type ListChannelPostsInput = {
  channelId: string;
  cursor?: string | null;
  limit?: number;
};
