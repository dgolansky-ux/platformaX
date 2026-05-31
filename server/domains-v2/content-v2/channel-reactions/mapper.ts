import type { ChannelReactionDTO } from "./dto";
import type { ChannelReactionRecord } from "./repository";

export function channelReactionTargetKey(targetType: string, targetId: string): string {
  return `${targetType}|${targetId}`;
}

export function toChannelReactionDTO(record: ChannelReactionRecord): ChannelReactionDTO {
  return {
    id: record.id,
    targetType: record.targetType,
    targetId: record.targetId,
    userId: record.userId,
    reactionType: record.reactionType,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
