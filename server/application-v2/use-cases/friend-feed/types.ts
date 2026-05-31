/**
 * application-v2/use-cases/friend-feed — application-layer view types.
 *
 * These shapes the UI consumes. Author summary is enriched here from
 * identity.public-api so the friend-feed UI never needs to call identity
 * directly. NO PII passes through (we only keep displayName / handle /
 * avatarRef from the public profile projection).
 */
import type {
  FriendFeedInteractionSummaryDTO,
  FriendPostCommentPublicDTO,
  FriendPostAuthorSummary,
  FriendPostVisibility,
} from "@server/domains-v2/content-v2/public-api";

export interface FriendFeedItemViewDTO {
  postId: string;
  author: FriendPostAuthorSummary;
  body: string;
  mediaRefs: readonly string[];
  visibility: FriendPostVisibility;
  status: "published" | "edited";
  createdAt: string;
  updatedAt: string;
  viewerCanComment: boolean;
  viewerCanReact: boolean;
  viewerIsAuthor: boolean;
  interactionSummary: FriendFeedInteractionSummaryDTO;
}

export interface FriendFeedPageViewDTO {
  items: readonly FriendFeedItemViewDTO[];
  nextCursor: string | null;
}

export interface PersonalProfileFriendFeedPreviewViewDTO {
  profileOwnerId: string;
  viewerRelation: "owner" | "friend" | "stranger";
  items: readonly FriendFeedItemViewDTO[];
  hasMore: boolean;
  restrictedReason: "none" | "not_friends" | "private_profile";
  ctaTargetRoute: "/friends-feed";
}

export interface FriendFeedComposerStateViewDTO {
  canPublish: boolean;
  disabledReason: "none" | "no_friends" | "transport_not_ready";
  defaultVisibility: FriendPostVisibility;
  supportedVisibilities: readonly FriendPostVisibility[];
}

export type FriendFeedCommentViewDTO = FriendPostCommentPublicDTO & {
  viewerCanEdit: boolean;
  viewerCanDelete: boolean;
};

export interface FriendFeedCommentListViewDTO {
  items: readonly FriendFeedCommentViewDTO[];
  nextCursor: string | null;
}
