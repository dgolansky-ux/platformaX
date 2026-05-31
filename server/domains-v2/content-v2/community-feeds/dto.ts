// === Slice 25 PRE-runtime ACK markers (EXC-016) =====================
// PX-CTX-001-ACK: pre-runtime content/feed DTO; explicit owner/ref context fields scheduled with content read-model slice. EXC-016.
// === end Slice 25 ACK markers =======================================

/**
 * content-v2 / community-feeds — DTOs + inputs for the three community feeds
 * (Slice 5). content-v2 owns posts + feed items only; it never stores community
 * membership/roles and never checks them — authority is enforced by
 * application-v2 via communities public-api.
 *
 * privacy classification: Public DTO — posts/feed items carry author + publisher
 * userId references only, never PII (no email/phone). `body` is post content.
 */

export type CommunityFeedType = "community_all" | "relational" | "staff_only";

export type CommunityPostStatus = "published" | "deleted";

export type CommunityPostDTO = {
  id: string;
  authorUserId: string;
  body: string;
  mediaRefs: readonly string[];
  status: CommunityPostStatus;
  sourceCommunityId: string;
  sourceFeedType: CommunityFeedType;
  createdAt: string;
};

/**
 * One denormalised feed item in one community's feed. `sourceCommunityId`
 * differs from `communityId` when the item was distributed down the structure
 * from an ancestor community; `isDistributed` exposes that for the trace badge.
 */
export type CommunityFeedItemDTO = {
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
  isDistributed: boolean;
  createdAt: string;
};

/** Create the post + its source feed item in one call. */
export type CreateCommunityPostInput = {
  authorUserId: string;
  publishedByUserId: string;
  body: string;
  mediaRefs?: readonly string[];
  sourceCommunityId: string;
  feedType: CommunityFeedType;
  /** Set when this post will also be distributed to descendant communities. */
  distributionId?: string | null;
};

/** Distribute an existing post into one descendant community's feed. */
export type DistributeCommunityPostInput = {
  postId: string;
  authorUserId: string;
  publishedByUserId: string;
  body: string;
  mediaRefs?: readonly string[];
  targetCommunityId: string;
  feedType: CommunityFeedType;
  sourceCommunityId: string;
  distributionId: string;
};

export type ListCommunityFeedQuery = {
  communityId: string;
  feedType: CommunityFeedType;
  cursor?: string | null;
  limit?: number;
};

export type RelationalCountQuery = {
  communityId: string;
  authorUserId: string;
  /** YYYY-MM */
  monthKey: string;
};

export type CommunityPostResult = {
  post: CommunityPostDTO;
  item: CommunityFeedItemDTO;
};
