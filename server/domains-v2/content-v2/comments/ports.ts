/**
 * content-v2 / comments — repository ports (internal). In-memory impl in
 * store.ts; a DB adapter implements the same interfaces later.
 */
import type { CommentStatus } from "./dto";

export type CommentRecord = {
  id: string;
  feedItemId: string;
  parentCommentId: string | null;
  authorUserId: string;
  body: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export interface CommentRepository {
  create(record: CommentRecord): Promise<CommentRecord>;
  getById(id: string): Promise<CommentRecord | null>;
  /**
   * Read model: active+deleted comments for one feed item, oldest first
   * (chronological thread order), with a stable id tie-breaker, bounded by
   * `limit`, after `cursor`. Soft-deleted bodies are stripped at the service
   * mapper boundary, NOT here, so callers can audit if needed.
   */
  list(feedItemId: string, cursor: string | null, limit: number): Promise<CommentRecord[]>;
  /** Active comment count for one feed item. */
  countActive(feedItemId: string): Promise<number>;
  /** Active comment counts for several feed items in one shot (batch). */
  countActiveBatch(feedItemIds: readonly string[]): Promise<Map<string, number>>;
  update(id: string, patch: { body: string; updatedAt: string }): Promise<CommentRecord | null>;
  softDelete(id: string, deletedAt: string): Promise<CommentRecord | null>;
}
