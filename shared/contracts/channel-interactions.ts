/**
 * shared/contracts/channel-interactions — frontend-facing contracts for
 * comments, reactions and interaction settings under channel posts.
 * Public DTO only: no email, phone or private contact fields.
 */
import type { ChannelsActionResult } from "./channels";

export type ChannelCommentPolicyDTO = "followers" | "community_members" | "leads_only";
export type ChannelReactionTargetType = "channel_post" | "channel_comment";

export type ChannelInteractionSettingsDTO = {
  channelId: string;
  commentsEnabled: boolean;
  reactionsEnabled: boolean;
  commentPolicy: ChannelCommentPolicyDTO;
  moderationPolicy: "leads_can_moderate" | "lead_permission_required";
  updatedAt: string;
  viewerCanUpdate: boolean;
};

export type ChannelReactionSummaryDTO = {
  targetType: ChannelReactionTargetType;
  targetId: string;
  counts: Readonly<Record<"like", number>>;
  total: number;
};

export type ChannelViewerReactionStateDTO = {
  targetType: ChannelReactionTargetType;
  targetId: string;
  active: readonly "like"[];
};

export type ChannelPostInteractionSummaryDTO = {
  channelPostId: string;
  commentCount: number;
  reactions: ChannelReactionSummaryDTO;
  viewer: ChannelViewerReactionStateDTO;
};

export type ChannelCommentDTO = {
  id: string;
  channelPostId: string;
  author: {
    userId: string;
    displayName: string;
    handle: string | null;
    avatarRef: string | null;
  } | null;
  body: string;
  status: "active" | "edited" | "deactivated";
  moderationReason?: string;
  createdAt: string;
  updatedAt: string;
  viewerCanEdit: boolean;
  viewerCanDeactivate: boolean;
  viewerCanModerate: boolean;
};

export type ChannelCommentInteractionSummaryDTO = {
  commentId: string;
  reactions: ChannelReactionSummaryDTO;
  viewer: ChannelViewerReactionStateDTO;
};

export type ChannelCommentListDTO = {
  items: readonly ChannelCommentDTO[];
  nextCursor: string | null;
  reactions: readonly ChannelCommentInteractionSummaryDTO[];
  canComment: boolean;
  canReact: boolean;
  permissionMessage: string | null;
};

export type CreateChannelCommentFrontendInput = {
  channelSlug: string;
  postId: string;
  body: string;
};

export type UpdateChannelCommentFrontendInput = CreateChannelCommentFrontendInput & {
  commentId: string;
};

export type DeactivateChannelCommentFrontendInput = {
  channelSlug: string;
  postId: string;
  commentId: string;
  moderationReason?: string;
};

export type ReactToChannelTargetFrontendInput = {
  channelSlug: string;
  postId: string;
  targetType: ChannelReactionTargetType;
  targetId: string;
  reactionType: "like";
  mode: "set" | "remove" | "toggle";
};

export type UpdateChannelInteractionSettingsFrontendInput = {
  channelSlug: string;
  commentsEnabled: boolean;
  reactionsEnabled: boolean;
  commentPolicy: ChannelCommentPolicyDTO;
};

export type ChannelInteractionsActionResult<T> = ChannelsActionResult<T>;
