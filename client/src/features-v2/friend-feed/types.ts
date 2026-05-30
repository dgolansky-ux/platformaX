/**
 * features-v2/friend-feed — UI types. Mirrors the application-v2 view DTOs so
 * the frontend never imports `@server/*`.
 */

export type FriendFeedVisibility = "friends_only" | "private" | "public";

export interface FriendFeedAuthorUi {
  userId: string;
  displayName: string;
  handle: string | null;
  avatarRef: string | null;
}

export interface FriendFeedItemUi {
  postId: string;
  author: FriendFeedAuthorUi;
  body: string;
  mediaRefs: readonly string[];
  visibility: FriendFeedVisibility;
  status: "published" | "edited";
  createdAt: string;
  updatedAt: string;
  viewerCanComment: boolean;
  viewerCanReact: boolean;
  viewerIsAuthor: boolean;
  likeCount: number;
  viewerLiked: boolean;
  commentCount: number;
}

export interface FriendFeedPageUi {
  items: readonly FriendFeedItemUi[];
  nextCursor: string | null;
}

export interface FriendFeedComposerStateUi {
  canPublish: boolean;
  disabledReason: "none" | "no_friends" | "transport_not_ready";
  defaultVisibility: FriendFeedVisibility;
  supportedVisibilities: readonly FriendFeedVisibility[];
}

export interface CreateFriendPostInputUi {
  viewerUserId: string;
  body: string;
  visibility: FriendFeedVisibility;
}

export interface ToggleReactionInputUi {
  viewerUserId: string;
  postId: string;
}

export interface FriendPostCommentUi {
  id: string;
  postId: string;
  author: FriendFeedAuthorUi;
  body: string;
  status: "active" | "deleted";
  createdAt: string;
}

export interface CreateCommentInputUi {
  viewerUserId: string;
  postId: string;
  body: string;
}

export interface PersonalProfileFriendFeedPreviewUi {
  profileOwnerId: string;
  viewerRelation: "owner" | "friend" | "stranger";
  items: readonly FriendFeedItemUi[];
  hasMore: boolean;
  restrictedReason: "none" | "not_friends" | "private_profile";
  ctaTargetRoute: "/friends-feed";
}

export type FriendFeedAdapterResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_FAILED" | "ADAPTER_FAILURE"; message: string } };
