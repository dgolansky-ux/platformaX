/**
 * shared/contracts/community-feeds — frontend-facing DTOs + inputs for the three
 * community feeds + descendant publishing (Slice 5).
 *
 * privacy classification: Public DTO — feed items carry author/publisher userId
 * references only, never PII. Settings carry community config only.
 */
import type { CommunityActionResult } from "./communities";

export type CommunityFeedType = "community_all" | "relational" | "staff_only";

export type CommunityPublishScope =
  | "current_community_only"
  | "direct_children"
  | "selected_descendants"
  | "all_descendants";

export type CommunityFeedPostingPolicy = "all_members" | "staff_only";

export type CommunityFeedItemDTO = {
  id: string;
  postId: string;
  communityId: string;
  feedType: CommunityFeedType;
  authorUserId: string;
  authorDisplayName: string;
  publishedByUserId: string;
  body: string;
  mediaRefs: readonly string[];
  sourceCommunityId: string;
  sourceCommunityName: string | null;
  distributionId: string | null;
  isDistributed: boolean;
  createdAt: string;
};

export type CommunityFeedSettingsDTO = {
  communityId: string;
  communityAllEnabled: boolean;
  communityAllPostingPolicy: CommunityFeedPostingPolicy;
  relationalEnabled: boolean;
  relationalMonthlyLimit: number;
  staffOnlyEnabled: boolean;
  descendantPublishingEnabled: boolean;
  descendantPublishingAllowedRoles: readonly ("founder" | "admin" | "moderator")[];
};

export type CommunityFeedTabVisibilityDTO = {
  visible: boolean;
  canPost: boolean;
};

export type CommunityRelationalTabDTO = CommunityFeedTabVisibilityDTO & {
  monthlyLimit: number;
  usedThisMonth: number;
  remaining: number;
};

export type CommunityFeedTabsStateDTO = {
  communityId: string;
  communityAll: CommunityFeedTabVisibilityDTO;
  relational: CommunityRelationalTabDTO;
  staffOnly: CommunityFeedTabVisibilityDTO;
  canPublishToDescendants: boolean;
};

/** A descendant community offered in the publish-scope picker. No PII. */
export type DescendantPublishTargetDTO = {
  id: string;
  slug: string;
  name: string;
  depth: number;
};

export type PublishCommunityPostFrontendInput = {
  communitySlug: string;
  feedType: CommunityFeedType;
  body: string;
  scope: CommunityPublishScope;
  selectedDescendantCommunityIds?: readonly string[];
};

export type PublishCommunityPostResultDTO = {
  item: CommunityFeedItemDTO;
  distributedCount: number;
  targetCommunityIds: readonly string[];
};

export type UpdateCommunityFeedSettingsFrontendInput = {
  communitySlug: string;
  communityAllEnabled?: boolean;
  communityAllPostingPolicy?: CommunityFeedPostingPolicy;
  relationalEnabled?: boolean;
  relationalMonthlyLimit?: number;
  staffOnlyEnabled?: boolean;
  descendantPublishingEnabled?: boolean;
};

export type ListCommunityFeedResultDTO = {
  items: readonly CommunityFeedItemDTO[];
  nextCursor: string | null;
};

export type CommunityFeedActionResult<T> = CommunityActionResult<T>;
