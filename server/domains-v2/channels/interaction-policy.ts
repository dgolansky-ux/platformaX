import type { ChannelLeadPermission } from "./contracts";
import type { ChannelCommentPolicyDTO, ChannelInteractionSettingsDTO } from "./interaction-settings";
import { leadHasPermission } from "./policy";

export function canUpdateChannelInteractionSettings(permissions: readonly ChannelLeadPermission[]): boolean {
  return leadHasPermission(permissions, "manage_channel_interactions");
}

export function canModerateChannelComment(permissions: readonly ChannelLeadPermission[]): boolean {
  return leadHasPermission(permissions, "moderate_channel_comments");
}

export function canViewChannelInteractions(args: {
  canViewPost: boolean;
}): boolean {
  return args.canViewPost;
}

export function canCommentOnChannelPost(args: {
  settings: Pick<ChannelInteractionSettingsDTO, "commentsEnabled" | "commentPolicy">;
  viewerFollows: boolean;
  viewerIsLead: boolean;
  viewerIsCommunityMember: boolean;
}): boolean {
  if (!args.settings.commentsEnabled) return false;
  const policy: ChannelCommentPolicyDTO = args.settings.commentPolicy;
  if (policy === "followers") return args.viewerFollows || args.viewerIsLead;
  if (policy === "community_members") return args.viewerIsCommunityMember || args.viewerIsLead;
  return args.viewerIsLead;
}

export function canReactToChannelPost(args: {
  settings: Pick<ChannelInteractionSettingsDTO, "reactionsEnabled">;
}): boolean {
  return args.settings.reactionsEnabled;
}
