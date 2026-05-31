/**
 * content-v2 / reactions — pure content-level validation. NO role/membership
 * checks (community visibility is enforced by application-v2 before calling
 * the service).
 */
import type { ReactionTargetType, ReactionType } from "./dto";
import { REACTION_TYPES } from "./dto";

const TARGET_TYPES: readonly ReactionTargetType[] = ["post", "comment"];

export function isValidReactionType(value: string): value is ReactionType {
  return (REACTION_TYPES as readonly string[]).includes(value);
}

export function isValidTargetType(value: string): value is ReactionTargetType {
  return (TARGET_TYPES as readonly string[]).includes(value);
}

export function reactionKey(
  targetType: ReactionTargetType,
  targetId: string,
  userId: string,
  reactionType: ReactionType,
): string {
  return `${targetType}|${targetId}|${userId}|${reactionType}`;
}
