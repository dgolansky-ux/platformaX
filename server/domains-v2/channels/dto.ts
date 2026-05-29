/**
 * channels — DTOs. Status: BACKEND_PARTIAL (in-memory runtime).
 *
 * privacy classification: Public DTO — channels are owned by communities and
 * carry NO PII. A follow references a userId only (not PII).
 */

export type ChannelOwnerType = "community";
export type ChannelVisibility = "public" | "private";
export type ChannelStatus = "active" | "archived" | "deleted";
export type FollowStatus = "active" | "unfollowed";

export type ChannelPublicDTO = {
  id: string;
  ownerType: ChannelOwnerType;
  ownerId: string;
  slug: string;
  name: string;
  description: string;
  visibility: ChannelVisibility;
  status: ChannelStatus;
  followerCount: number;
};

export type ChannelFollowDTO = {
  channelId: string;
  followerUserId: string;
  status: FollowStatus;
  createdAt: string;
};

export type CreateChannelInput = {
  ownerType: ChannelOwnerType;
  ownerId: string;
  slug: string;
  name: string;
  description?: string;
  visibility?: ChannelVisibility;
};
