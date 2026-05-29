/**
 * content-v2 / reactions — repository ports (internal). In-memory impl in
 * store.ts; a DB adapter implements the same interfaces later. Uniqueness
 * (targetType, targetId, userId, reactionType) is enforced inside the
 * repository so a duplicate setReaction is idempotent.
 */
import type { ReactionTargetType, ReactionType } from "./dto";

export type ReactionRecord = {
  id: string;
  targetType: ReactionTargetType;
  targetId: string;
  userId: string;
  reactionType: ReactionType;
  createdAt: string;
  /** Unique guard: `${targetType}|${targetId}|${userId}|${reactionType}`. */
  uniqueKey: string;
};

export interface ReactionRepository {
  /** Idempotent: returns existing record if uniqueKey already exists. */
  upsert(record: ReactionRecord): Promise<{ record: ReactionRecord; created: boolean }>;
  /** Returns true if a row was removed. */
  remove(targetType: ReactionTargetType, targetId: string, userId: string, reactionType: ReactionType): Promise<boolean>;
  /** Existing reaction for one (user, target, type) tuple — null if none. */
  findOne(targetType: ReactionTargetType, targetId: string, userId: string, reactionType: ReactionType): Promise<ReactionRecord | null>;
  /** Batch counts per target — Map keyed by `${targetType}|${targetId}`. */
  countsByTarget(targets: readonly { targetType: ReactionTargetType; targetId: string }[]): Promise<Map<string, Record<ReactionType, number>>>;
  /** Viewer state — Map keyed by `${targetType}|${targetId}` → active reaction types. */
  viewerStateByTarget(userId: string, targets: readonly { targetType: ReactionTargetType; targetId: string }[]): Promise<Map<string, readonly ReactionType[]>>;
}
