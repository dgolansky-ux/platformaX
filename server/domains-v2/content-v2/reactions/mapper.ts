/**
 * content-v2 / reactions — mapper. Repo record → public DTO (no PII).
 */
import type { ReactionDTO } from "./dto";
import type { ReactionRecord } from "./ports";

export function toReactionDTO(record: ReactionRecord): ReactionDTO {
  return {
    id: record.id,
    targetType: record.targetType,
    targetId: record.targetId,
    userId: record.userId,
    reactionType: record.reactionType,
    createdAt: record.createdAt,
  };
}

export function targetKey(targetType: string, targetId: string): string {
  return `${targetType}|${targetId}`;
}
