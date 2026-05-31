/**
 * channels — interaction settings DTOs.
 *
 * privacy classification: Public DTO — channel settings only, no PII.
 */
export type ChannelCommentPolicyDTO = "followers" | "community_members" | "leads_only";
export type ChannelModerationPolicyDTO = "leads_can_moderate" | "lead_permission_required";

export type ChannelInteractionSettingsDTO = {
  channelId: string;
  commentsEnabled: boolean;
  reactionsEnabled: boolean;
  commentPolicy: ChannelCommentPolicyDTO;
  moderationPolicy: ChannelModerationPolicyDTO;
  updatedAt: string;
};

export type UpdateChannelInteractionSettingsInput = {
  channelId: string;
  commentsEnabled?: boolean;
  reactionsEnabled?: boolean;
  commentPolicy?: ChannelCommentPolicyDTO;
  moderationPolicy?: ChannelModerationPolicyDTO;
};
