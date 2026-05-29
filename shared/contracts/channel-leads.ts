/**
 * shared/contracts/channel-leads — frontend lead management contracts.
 * privacy classification: Public DTO — user ids and display names only.
 */

export type ChannelLeadRole = "lead" | "co_lead";
export type ChannelLeadPermission =
  | "manage_channel_profile"
  | "publish_channel_content"
  | "manage_channel_content"
  | "pin_channel_post"
  | "manage_channel_leads"
  | "view_channel_stats";

export const CHANNEL_LEAD_PERMISSIONS: readonly ChannelLeadPermission[] = [
  "manage_channel_profile",
  "publish_channel_content",
  "manage_channel_content",
  "pin_channel_post",
  "manage_channel_leads",
  "view_channel_stats",
];

export const MAX_ACTIVE_LEADS = 5;
export const MIN_ACTIVE_LEADS = 1;

export type ChannelLeadPublicDTO = {
  userId: string;
  displayName: string;
  role: ChannelLeadRole;
  permissions: readonly ChannelLeadPermission[];
};

export type AssignChannelLeadFrontendInput = {
  channelSlug: string;
  targetUserId: string;
  role: ChannelLeadRole;
  permissions?: readonly ChannelLeadPermission[];
};

export type RevokeChannelLeadFrontendInput = {
  channelSlug: string;
  targetUserId: string;
};

export type UpdateChannelLeadPermissionsFrontendInput = {
  channelSlug: string;
  targetUserId: string;
  permissions: readonly ChannelLeadPermission[];
};
