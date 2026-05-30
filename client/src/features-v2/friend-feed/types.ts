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

/**
 * Friend-feed view of a workplace mini-teaser.
 *
 * Mirrors the application-v2 `FriendFeedWorkplaceTeaserItemViewDTO` shape so
 * the friend-feed feature can render the mini-card without importing from
 * another feature. The teaser is intentionally smaller than a full post and
 * carries only a short preview plus the target route to the full workplace
 * post — never the full body, never contact data.
 */
export interface FriendFeedWorkplaceTeaserAuthorUi {
  userId: string;
  displayName: string;
  handle: string | null;
  avatarRef: string | null;
}

export interface FriendFeedWorkplaceTeaserUi {
  id: string;
  sourcePostId: string;
  workplaceId: string;
  workplaceName: string;
  workplaceSlug: string;
  ownerUserId: string;
  previewText: string;
  previewMediaRef: string | null;
  visibility: "friends_only" | "public";
  createdAt: string;
  /** Logical route the UI navigates to on click — the full workplace post. */
  targetRoute: string;
}

export interface FriendFeedWorkplaceTeaserItemUi {
  teaser: FriendFeedWorkplaceTeaserUi;
  owner: FriendFeedWorkplaceTeaserAuthorUi;
}

export interface FriendFeedWorkplaceTeaserPageUi {
  items: readonly FriendFeedWorkplaceTeaserItemUi[];
  nextCursor: string | null;
}
