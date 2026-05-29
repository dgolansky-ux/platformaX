/**
 * shared/contracts/channels — frontend-facing DTOs + inputs for the channels
 * directory + channel profile + lead management (Slice 7).
 *
 * privacy classification: Public DTO — references userId/communityId only,
 * never PII.
 */
import type { CommunityActionResult } from "./communities";
import type {
  ChannelLeadPublicDTO,
  ChannelLeadRole,
} from "./channel-leads";
import type { ChannelFeedDTO } from "./channel-posts";

export type ChannelOwnerType = "community";
export type ChannelVisibility = "public" | "private";
export type ChannelStatus = "active" | "archived";

export type ChannelOwnerSummaryDTO = {
  communityId: string;
  communitySlug: string;
  communityName: string;
};

export type ChannelCardDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  visibility: ChannelVisibility;
  status: ChannelStatus;
  followerCount: number;
  leadCount: number;
  owner: ChannelOwnerSummaryDTO;
  viewerFollows: boolean;
  viewerIsLead: boolean;
  viewerLeadRole: ChannelLeadRole | null;
  lastPostPreview?: string;
  postCount?: number;
};

export type ChannelsDirectoryDTO = {
  followed: readonly ChannelCardDTO[];
  myCommunityChannels: readonly ChannelCardDTO[];
  leading: readonly ChannelCardDTO[];
  discover: readonly ChannelCardDTO[];
};

export type ChannelProfileDTO = {
  channel: ChannelCardDTO;
  leads: readonly ChannelLeadPublicDTO[];
  feed: ChannelFeedDTO;
  viewer: {
    follows: boolean;
    isLead: boolean;
    leadRole: ChannelLeadRole | null;
    canManageChannel: boolean;
    canManageLeads: boolean;
    canFollow: boolean;
  };
};

export type CreateChannelFrontendInput = {
  communitySlug: string;
  slug: string;
  name: string;
  description?: string;
  visibility?: ChannelVisibility;
  initialLeadUserId?: string;
};

export type FollowChannelFrontendInput = {
  channelSlug: string;
};

export type ChannelsActionResult<T> = CommunityActionResult<T>;
