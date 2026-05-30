import type { ChannelReactionTargetType, ChannelReactionType } from "./dto";
import { CHANNEL_REACTION_TYPES } from "./dto";

export function isValidChannelReactionType(value: string): value is ChannelReactionType {
  return (CHANNEL_REACTION_TYPES as readonly string[]).includes(value);
}

export function channelReactionKey(
  targetType: ChannelReactionTargetType,
  targetId: string,
  userId: string,
  reactionType: ChannelReactionType,
): string {
  return `${targetType}|${targetId}|${userId}|${reactionType}`;
}
