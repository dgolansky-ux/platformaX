/**
 * QUALITY_STRUCTURE_EXCEPTION: Canonical contract surface for friend-posts
 * foundation slice; split only after the API stabilizes beyond Slice 11.
 *
 * content-v2/friend-posts — DTOs.
 *
 * privacy classification: Public DTO — author references are user ids only,
 * never PII. Author display data is enriched at the application layer via
 * identity.public-api.
 */

export type FriendPostVisibility = "friends_only" | "private" | "public";
export type FriendPostStatus = "draft" | "published" | "edited" | "deactivated";

export interface FriendPostDTO {
  id: string;
  authorUserId: string;
  body: string;
  mediaRefs: readonly string[];
  visibility: FriendPostVisibility;
  status: FriendPostStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Public projection of a friend post — no createdBy leak via aliases. */
export interface FriendPostPublicDTO {
  id: string;
  authorUserId: string;
  body: string;
  mediaRefs: readonly string[];
  visibility: FriendPostVisibility;
  status: "published" | "edited" | "deactivated";
  createdAt: string;
  updatedAt: string;
}

/** Author public summary the application layer fills in from identity. */
export interface FriendPostAuthorSummary {
  userId: string;
  displayName: string;
  handle: string | null;
  avatarRef: string | null;
}

/** Feed item DTO — what reaches the UI list. Author summary attached. */
export interface FriendFeedItemDTO {
  postId: string;
  author: FriendPostAuthorSummary;
  body: string;
  mediaRefs: readonly string[];
  visibility: FriendPostVisibility;
  createdAt: string;
  updatedAt: string;
  status: "published" | "edited";
  viewerCanComment: boolean;
  viewerCanReact: boolean;
}

export interface FriendFeedPageDTO {
  items: readonly FriendFeedItemDTO[];
  nextCursor: string | null;
}

export interface FriendPostCommentDTO {
  id: string;
  friendPostId: string;
  authorUserId: string;
  body: string;
  status: "active" | "deleted";
  createdAt: string;
  updatedAt: string;
}

export interface FriendPostCommentPublicDTO {
  id: string;
  friendPostId: string;
  author: FriendPostAuthorSummary;
  body: string;
  status: "active" | "deleted";
  createdAt: string;
  updatedAt: string;
}

export interface FriendPostReactionSummaryDTO {
  friendPostId: string;
  likeCount: number;
  viewerLiked: boolean;
}

export interface FriendPostViewerStateDTO {
  friendPostId: string;
  viewerCanView: boolean;
  viewerCanComment: boolean;
  viewerCanReact: boolean;
  isOwner: boolean;
}

export interface PersonalProfileFriendFeedPreviewDTO {
  profileOwnerId: string;
  viewerRelation: "owner" | "friend" | "stranger";
  visible: readonly FriendFeedItemDTO[];
  hasMore: boolean;
  restrictedReason: "none" | "not_friends" | "private_profile";
}

export interface CreateFriendPostCommand {
  authorUserId: string;
  body: string;
  mediaRefs?: readonly string[];
  visibility?: FriendPostVisibility;
}

export interface UpdateFriendPostInput {
  friendPostId: string;
  actorUserId: string;
  body?: string;
  visibility?: FriendPostVisibility;
}

export interface DeactivateFriendPostInput {
  friendPostId: string;
  actorUserId: string;
}

export interface ListFriendFeedCommand {
  viewerUserId: string;
  cursor?: string | null;
  limit?: number;
}

export interface GetProfileFriendFeedPreviewCommand {
  viewerUserId: string;
  profileOwnerId: string;
  limit?: number;
}

export interface CreateFriendPostCommentInput {
  friendPostId: string;
  authorUserId: string;
  body: string;
}

export interface DeleteFriendPostCommentInput {
  commentId: string;
  actorUserId: string;
}

export interface ListFriendPostCommentsQuery {
  friendPostId: string;
  cursor?: string | null;
  limit?: number;
}

export const FRIEND_POST_BODY_MAX = 4000;
export const FRIEND_POST_COMMENT_BODY_MAX = 2000;
export const FRIEND_POST_MEDIA_REFS_MAX = 8;

export const FRIEND_FEED_DEFAULT_LIMIT = 20;
export const FRIEND_FEED_MAX_LIMIT = 50;
export const PROFILE_PREVIEW_DEFAULT_LIMIT = 4;
export const PROFILE_PREVIEW_MAX_LIMIT = 8;
