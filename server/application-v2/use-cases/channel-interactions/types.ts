import type {
  ChannelCommentDTO,
} from "@server/domains-v2/content-v2/channel-comments/public-api";
import type {
  ChannelReactionSummaryDTO,
  ChannelReactionType,
  ChannelViewerReactionStateDTO,
} from "@server/domains-v2/content-v2/channel-reactions/public-api";
import type {
  ChannelCommentPolicyDTO,
  ChannelInteractionSettingsDTO,
  ChannelModerationPolicyDTO,
} from "@server/domains-v2/channels/public-api";

export type ChannelInteractionsErrorCode =
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "EMPTY_BODY"
  | "BODY_TOO_LONG"
  | "COMMENT_NOT_FOUND"
  | "PARENT_NOT_FOUND"
  | "ALREADY_DEACTIVATED"
  | "INVALID_REACTION_TYPE";

export type ChannelInteractionsResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ChannelInteractionsErrorCode; message: string } };

export type ChannelCommentViewDTO = ChannelCommentDTO & {
  authorPublicSummary: {
    userId: string;
    displayName: string;
    handle: string | null;
    avatarRef: string | null;
  } | null;
  viewerCanEdit: boolean;
  viewerCanDeactivate: boolean;
  viewerCanModerate: boolean;
};

export type ChannelCommentInteractionSummaryDTO = {
  commentId: string;
  reactions: ChannelReactionSummaryDTO;
  viewer: ChannelViewerReactionStateDTO;
};

export type ChannelPostInteractionSummaryDTO = {
  channelPostId: string;
  commentCount: number;
  reactions: ChannelReactionSummaryDTO;
  viewer: ChannelViewerReactionStateDTO;
};

export type ListChannelPostCommentsResultDTO = {
  items: readonly ChannelCommentViewDTO[];
  nextCursor: string | null;
  reactions: readonly ChannelCommentInteractionSummaryDTO[];
};

export type CreateChannelCommentCommand = {
  actorUserId: string;
  channelPostId: string;
  body: string;
  parentCommentId?: string | null;
};

export type UpdateChannelCommentCommand = {
  actorUserId: string;
  channelPostId: string;
  commentId: string;
  body: string;
};

export type DeactivateChannelCommentCommand = {
  actorUserId: string;
  channelPostId: string;
  commentId: string;
  moderationReason?: string;
};

export type ListChannelPostCommentsQuery = {
  actorUserId: string;
  channelPostId: string;
  cursor?: string | null;
  limit?: number;
};

export type ReactToChannelPostCommand = {
  actorUserId: string;
  channelPostId: string;
  reactionType: ChannelReactionType;
  mode: "set" | "remove" | "toggle";
};

export type ReactToChannelCommentCommand = ReactToChannelPostCommand & {
  commentId: string;
};

export type ChannelPostInteractionSummaryQuery = {
  actorUserId: string;
  channelPostIds: readonly string[];
};

export type UpdateChannelInteractionSettingsCommand = {
  actorUserId: string;
  channelId: string;
  commentsEnabled?: boolean;
  reactionsEnabled?: boolean;
  commentPolicy?: ChannelCommentPolicyDTO;
  moderationPolicy?: ChannelModerationPolicyDTO;
};

export type ReactToChannelTargetResult = {
  active: boolean;
  reactions: ChannelReactionSummaryDTO;
  viewer: ChannelViewerReactionStateDTO;
};

export type ChannelInteractionSettingsViewDTO = ChannelInteractionSettingsDTO & {
  viewerCanUpdate: boolean;
};
