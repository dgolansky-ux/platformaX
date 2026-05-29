/**
 * shared/contracts/channel-posts — frontend channel feed contracts.
 * privacy classification: Public DTO — public author summary only, no PII.
 */

export type ChannelPostDTO = {
  id: string;
  channelId: string;
  author: {
    userId: string;
    displayName: string;
    handle: string | null;
    avatarRef: string | null;
  } | null;
  body: string;
  mediaRefs: readonly string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  viewerCanPin: boolean;
  viewerCanManage: boolean;
};

export type ChannelFeedDTO = {
  pinnedPost: ChannelPostDTO | null;
  items: readonly ChannelPostDTO[];
  nextCursor: string | null;
  canViewFeed: boolean;
  canPublish: boolean;
  canManageContent: boolean;
  canPin: boolean;
};

export type CreateChannelPostFrontendInput = {
  channelSlug: string;
  body: string;
  mediaRefs?: readonly string[];
};

export type ChannelPostActionFrontendInput = {
  channelSlug: string;
  postId: string;
};
