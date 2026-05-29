/**
 * channels — cross-domain contracts.
 *
 * Lead roles/permissions are stable integration contracts consumed by
 * application-v2/channel-content. No runtime implementation lives here.
 */
export type ChannelLeadRole = "lead" | "co_lead";
export type ChannelLeadStatus = "active" | "revoked";
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
