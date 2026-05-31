/**
 * content-v2 / community-feeds — repository ports (internal). In-memory impl in
 * store.ts; a DB adapter implements the same interfaces later.
 */
import type { CommunityFeedType, CommunityPostStatus } from "./dto";

export type CommunityPostRecord = {
  id: string;
  authorUserId: string;
  publishedByUserId: string;
  body: string;
  mediaRefs: readonly string[];
  status: CommunityPostStatus;
  sourceCommunityId: string;
  sourceFeedType: CommunityFeedType;
  createdAt: string;
  updatedAt: string;
};

export type CommunityFeedItemRecord = {
  id: string;
  postId: string;
  communityId: string;
  feedType: CommunityFeedType;
  authorUserId: string;
  publishedByUserId: string;
  body: string;
  mediaRefs: readonly string[];
  sourceCommunityId: string;
  distributionId: string | null;
  status: "active" | "deleted";
  createdAt: string;
  /** Unique guard: `${communityId}|${feedType}|${distributionId ?? postId}`. */
  dedupeKey: string;
};

export interface CommunityPostRepository {
  create(record: CommunityPostRecord): Promise<CommunityPostRecord>;
  getById(id: string): Promise<CommunityPostRecord | null>;
  /** Returns the raw record even when deleted; for moderator + admin reads. */
  getByIdAnyStatus(id: string): Promise<CommunityPostRecord | null>;
  markDeleted(id: string, updatedAt: string): Promise<CommunityPostRecord | null>;
}

export interface CommunityFeedItemRepository {
  /** Returns null when the dedupeKey already exists (idempotent distribution). */
  add(record: CommunityFeedItemRecord): Promise<CommunityFeedItemRecord | null>;
  /** Lookup a single feed item by id (active or deleted). */
  getById(id: string): Promise<CommunityFeedItemRecord | null>;
  /** Mark all feed items derived from a post as deleted. */
  markItemsForPostDeleted(postId: string): Promise<number>;
  /**
   * Read model for one community feed: active items for (communityId, feedType),
   * newest-first with a stable id tie-breaker, bounded by `limit`, after `cursor`.
   */
  list(
    communityId: string,
    feedType: CommunityFeedType,
    cursor: string | null,
    limit: number,
  ): Promise<CommunityFeedItemRecord[]>;
  /** Count active relational items authored by a user in a community in a month. */
  countRelationalForAuthorMonth(
    communityId: string,
    authorUserId: string,
    monthKey: string,
  ): Promise<number>;
}
