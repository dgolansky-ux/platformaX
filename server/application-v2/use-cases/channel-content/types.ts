import type { ChannelFeedItemDTO } from "@server/domains-v2/content-v2/channel-posts/public-api";

export type ChannelContentErrorCode =
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "EMPTY_BODY"
  | "BODY_TOO_LONG"
  | "DEACTIVATED";

export type ChannelContentResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ChannelContentErrorCode; message: string } };

export type AuthorPublicSummary = {
  userId: string;
  displayName: string;
  handle: string | null;
  avatarRef: string | null;
};

export type ChannelSummary = {
  id: string;
  slug: string;
  name: string;
  visibility: "public" | "private";
  followerCount: number;
  leadCount: number;
};

export type ChannelFeedViewItem = ChannelFeedItemDTO & {
  channelSummary: ChannelSummary;
  authorPublicSummary: AuthorPublicSummary | null;
};

export type ChannelFeedView = {
  pinnedPost: ChannelFeedViewItem | null;
  items: readonly ChannelFeedViewItem[];
  nextCursor: string | null;
};

export type ChannelPageView = {
  channel: ChannelSummary;
  viewer: {
    canViewFeed: boolean;
    canPublish: boolean;
    canManageContent: boolean;
    canPin: boolean;
  };
  feed: ChannelFeedView;
};

export type CreateChannelPostCommand = {
  actorUserId: string;
  channelId: string;
  body: string;
  mediaRefs?: readonly string[];
};

export type UpdateChannelPostCommand = {
  actorUserId: string;
  postId: string;
  body: string;
  mediaRefs?: readonly string[];
};

export type ChannelPostActionCommand = {
  actorUserId: string;
  postId: string;
};

export type ListChannelFeedQuery = {
  viewerUserId: string;
  channelId: string;
  cursor?: string | null;
  limit?: number;
};
