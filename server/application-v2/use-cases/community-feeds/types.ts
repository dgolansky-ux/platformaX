/**
 * application-v2/use-cases/community-feeds — command/result types (Slice 5).
 * Server-side orchestration types; the frontend mirrors these in
 * shared/contracts/community-feeds.
 */
import type {
  CommunityFeedItemDTO,
  CommunityFeedType,
  CommunityPostDTO,
} from "@server/domains-v2/content-v2/public-api";

export type PublishScope =
  | "current_community_only"
  | "direct_children"
  | "selected_descendants"
  | "all_descendants";

export type PublishCommunityPostCommand = {
  actorUserId: string;
  communityId: string;
  feedType: CommunityFeedType;
  body: string;
  mediaRefs?: readonly string[];
  scope: PublishScope;
  selectedDescendantCommunityIds?: readonly string[];
};

export type PublishCommunityPostValue = {
  post: CommunityPostDTO;
  sourceItem: CommunityFeedItemDTO;
  distributionId: string | null;
  distributedCount: number;
  targetCommunityIds: readonly string[];
};

export type CommunityFeedErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "FEED_DISABLED"
  | "QUOTA_EXCEEDED"
  | "RELATIONAL_NO_PROPAGATION"
  | "TARGET_NOT_DESCENDANT"
  | "TARGET_INACTIVE"
  | "TOO_MANY_TARGETS_REQUIRES_ASYNC_DISTRIBUTION"
  | "EMPTY_BODY"
  | "INVALID_FEED_TYPE";

export type CommunityFeedResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: CommunityFeedErrorCode; message: string } };

export type CommunityFeedTabVisibility = {
  visible: boolean;
  canPost: boolean;
};

export type CommunityFeedTabsStateDTO = {
  communityId: string;
  communityAll: CommunityFeedTabVisibility;
  relational: CommunityFeedTabVisibility & { monthlyLimit: number; usedThisMonth: number; remaining: number };
  staffOnly: CommunityFeedTabVisibility;
  canPublishToDescendants: boolean;
};

export type ListCommunityFeedResult = CommunityFeedResult<{
  items: readonly CommunityFeedItemDTO[];
  nextCursor: string | null;
}>;

/** Safety cap for synchronous all_descendants fan-out (see distribution.ts). */
export const MAX_DESCENDANT_TARGETS = 100;
