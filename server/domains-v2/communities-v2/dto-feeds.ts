/**
 * communities-v2 — community feed settings DTOs (Slice 5). communities-v2 owns
 * the *settings* and the *policy* for the three feeds (community_all / relational
 * / staff_only) and for publishing down the structure; it NEVER stores posts
 * (those live in content-v2).
 *
 * privacy classification: settings DTO carries no PII — only community config.
 */

export type CommunityFeedPostingPolicy = "all_members" | "staff_only";

/** Roles allowed to publish a post down into descendant communities. */
export type DescendantPublishRole = "founder" | "admin" | "moderator";

export type CommunityFeedSettingsDTO = {
  communityId: string;
  communityAllEnabled: boolean;
  communityAllPostingPolicy: CommunityFeedPostingPolicy;
  relationalEnabled: boolean;
  /** Per-user per-month relational publish limit, 1..10. */
  relationalMonthlyLimit: number;
  staffOnlyEnabled: boolean;
  descendantPublishingEnabled: boolean;
  descendantPublishingAllowedRoles: readonly DescendantPublishRole[];
  updatedAt: string;
};

export type UpdateCommunityFeedSettingsInput = {
  actorUserId: string;
  communityId: string;
  communityAllEnabled?: boolean;
  communityAllPostingPolicy?: CommunityFeedPostingPolicy;
  relationalEnabled?: boolean;
  relationalMonthlyLimit?: number;
  staffOnlyEnabled?: boolean;
  descendantPublishingEnabled?: boolean;
  descendantPublishingAllowedRoles?: readonly DescendantPublishRole[];
};

export type FeedSettingsErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_RELATIONAL_LIMIT"
  | "INVALID_POSTING_POLICY"
  | "INVALID_DESCENDANT_ROLE";

export type FeedSettingsResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: FeedSettingsErrorCode; message: string } };

/** Default settings for a community that has never customised its feeds. */
export function defaultFeedSettings(communityId: string, updatedAt: string): CommunityFeedSettingsDTO {
  return {
    communityId,
    communityAllEnabled: true,
    communityAllPostingPolicy: "all_members",
    relationalEnabled: false,
    relationalMonthlyLimit: 3,
    staffOnlyEnabled: true,
    descendantPublishingEnabled: true,
    descendantPublishingAllowedRoles: ["founder", "admin"],
    updatedAt,
  };
}
