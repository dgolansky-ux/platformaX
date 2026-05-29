/**
 * application-v2/use-cases/channels — command/result types (Slice 7).
 */
import type {
  ChannelLeadDTO,
  ChannelLeadPermission,
  ChannelLeadRole,
  ChannelPublicDTO,
  ChannelVisibility,
  ChannelsErrorCode,
} from "@server/domains-v2/channels/public-api";
import type { CommunityPublicSummary } from "@server/domains-v2/communities-v2/contracts";

export type ChannelsUseCaseErrorCode = "FORBIDDEN" | "NOT_FOUND" | "MEMBERSHIP_REQUIRED" | ChannelsErrorCode;

export type ChannelsUseCaseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ChannelsUseCaseErrorCode; message: string } };

export type CreateCommunityChannelCommand = {
  actorUserId: string;
  communityId: string;
  slug: string;
  name: string;
  description?: string;
  visibility?: ChannelVisibility;
  /** Optional explicit initial lead — defaults to the actor. Must be an active
   * member of the community. */
  initialLeadUserId?: string;
};

export type AssignCommunityChannelLeadCommand = {
  actorUserId: string;
  channelId: string;
  targetUserId: string;
  role: ChannelLeadRole;
  permissions?: readonly ChannelLeadPermission[];
};

export type RevokeCommunityChannelLeadCommand = {
  actorUserId: string;
  channelId: string;
  targetUserId: string;
};

export type UpdateCommunityChannelLeadPermissionsCommand = {
  actorUserId: string;
  channelId: string;
  targetUserId: string;
  permissions: readonly ChannelLeadPermission[];
};

export type FollowChannelCommand = {
  actorUserId: string;
  channelId: string;
};

export type ChannelDirectoryCard = {
  channel: ChannelPublicDTO;
  owner: CommunityPublicSummary | null;
  viewerFollows: boolean;
  viewerIsLead: boolean;
};

export type ChannelsDirectoryView = {
  followed: readonly ChannelDirectoryCard[];
  myCommunityChannels: readonly ChannelDirectoryCard[];
  leading: readonly ChannelDirectoryCard[];
  discover: readonly ChannelDirectoryCard[];
};

export type ChannelLeadPublicView = {
  userId: string;
  role: ChannelLeadRole;
  permissions: readonly ChannelLeadPermission[];
};

export type ChannelProfileView = {
  channel: ChannelPublicDTO;
  owner: CommunityPublicSummary | null;
  leads: readonly ChannelLeadPublicView[];
  viewer: {
    follows: boolean;
    isLead: boolean;
    leadRole: ChannelLeadRole | null;
    canManageChannel: boolean;
    canManageLeads: boolean;
    canFollow: boolean;
  };
};

export type ChannelsDirectoryQuery = {
  actorUserId: string;
  myCommunityIds: readonly string[];
  /** Discover cap — defaults to 12. */
  discoverLimit?: number;
};

export type GetChannelLeadsView = {
  channelId: string;
  leads: readonly ChannelLeadDTO[];
};
