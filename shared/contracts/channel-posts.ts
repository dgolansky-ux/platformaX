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
  interactions: {
    commentCount: number;
    reactionCount: number;
    viewerLiked: boolean;
    commentsEnabled: boolean;
    reactionsEnabled: boolean;
    canComment: boolean;
    canReact: boolean;
    canModerateComments: boolean;
    permissionMessage: string | null;
  };
};

export type ChannelFeedDTO = {
  pinnedPost: ChannelPostDTO | null;
  items: readonly ChannelPostDTO[];
  nextCursor: string | null;
  canViewFeed: boolean;
  canPublish: boolean;
  canManageContent: boolean;
  canPin: boolean;
  interactionSettings: {
    channelId: string;
    commentsEnabled: boolean;
    reactionsEnabled: boolean;
    commentPolicy: "followers" | "community_members" | "leads_only";
    moderationPolicy: "leads_can_moderate" | "lead_permission_required";
    updatedAt: string;
    viewerCanUpdate: boolean;
  };
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
