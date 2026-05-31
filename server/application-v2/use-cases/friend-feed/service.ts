// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

// ALLOW_FILE_SIZE_EXCEPTION — Slice 19 added friend-aware visibility checks
// (getFriendIdsForViewer + friends_only filtering) to the existing
// friend-feed orchestrator. Registered in EXCEPTIONS_REGISTER.md (EXC-011).
/**
 * application-v2/use-cases/friend-feed — orchestration.
 *
 * Composes social (friendship graph) + content-v2/friend-posts (post + comment
 * + reaction data) + identity (author public summary). Does NOT own any
 * persistence and does NOT bypass public-api on any of those domains.
 */
import type {
  CreateFriendPostCommand,
  DeactivateFriendPostInput,
  FriendPostAuthorSummary,
  FriendPostDTO,
  FriendPostPublicDTO,
  FriendPostsResult,
  FriendPostsService,
  FriendPostVisibility,
  UpdateFriendPostInput,
} from "@server/domains-v2/content-v2/public-api";
import {
  PROFILE_PREVIEW_DEFAULT_LIMIT,
  PROFILE_PREVIEW_MAX_LIMIT,
} from "@server/domains-v2/content-v2/public-api";
import type { SocialContactsService } from "@server/domains-v2/social/public-api";
import type { IdentityService } from "@server/domains-v2/identity/public-api";
import type {
  FriendFeedComposerStateViewDTO,
  FriendFeedCommentListViewDTO,
  FriendFeedItemViewDTO,
  FriendFeedPageViewDTO,
  PersonalProfileFriendFeedPreviewViewDTO,
} from "./types";

export type FriendFeedUseCaseDeps = {
  friendPosts: FriendPostsService;
  social: SocialContactsService;
  identity: IdentityService;
};

export interface FriendFeedUseCaseV2 {
  createFriendFeedPost(input: {
    viewerUserId: string;
    body: string;
    mediaRefs?: readonly string[];
    visibility?: FriendPostVisibility;
  }): Promise<FriendPostsResult<FriendPostPublicDTO>>;

  updateOwnFriendPost(input: {
    viewerUserId: string;
    friendPostId: string;
    body?: string;
    visibility?: FriendPostVisibility;
  }): Promise<FriendPostsResult<FriendPostPublicDTO>>;

  deactivateOwnFriendPost(input: {
    viewerUserId: string;
    friendPostId: string;
  }): Promise<FriendPostsResult<FriendPostPublicDTO>>;

  listFriendFeed(input: {
    viewerUserId: string;
    cursor?: string | null;
    limit?: number;
  }): Promise<FriendFeedPageViewDTO>;

  getPersonalProfileFriendFeedPreview(input: {
    viewerUserId: string;
    profileOwnerId: string;
    limit?: number;
  }): Promise<PersonalProfileFriendFeedPreviewViewDTO>;

  getFriendFeedComposerState(input: {
    viewerUserId: string;
  }): Promise<FriendFeedComposerStateViewDTO>;

  createFriendPostComment(input: {
    viewerUserId: string;
    friendPostId: string;
    body: string;
  }): Promise<FriendPostsResult<FriendFeedCommentListViewDTO>>;

  listFriendPostComments(input: {
    viewerUserId: string;
    friendPostId: string;
    cursor?: string | null;
    limit?: number;
  }): Promise<FriendPostsResult<FriendFeedCommentListViewDTO>>;

  updateOwnFriendPostComment(input: {
    viewerUserId: string;
    commentId: string;
    friendPostId: string;
    body: string;
  }): Promise<FriendPostsResult<FriendFeedCommentListViewDTO>>;

  deactivateOwnFriendPostComment(input: {
    viewerUserId: string;
    commentId: string;
    friendPostId: string;
  }): Promise<FriendPostsResult<FriendFeedCommentListViewDTO>>;

  reactToFriendPost(input: {
    viewerUserId: string;
    friendPostId: string;
    mode?: "toggle" | "set" | "remove";
  }): ReturnType<FriendPostsService["toggleReaction"]>;

  reactToFriendPostComment(input: {
    viewerUserId: string;
    commentId: string;
    mode?: "toggle" | "set" | "remove";
  }): ReturnType<FriendPostsService["reactToComment"]>;

  getFriendFeedInteractionSummary(input: {
    viewerUserId: string;
    friendPostIds: readonly string[];
  }): ReturnType<FriendPostsService["getInteractionSummary"]>;
}

type Deps = FriendFeedUseCaseDeps;
type SocialWithFriendIds = SocialContactsService & {
  getFriendIdsForViewer?: (
    viewerUserId: string,
  ) => Promise<readonly string[]>;
  isBlocked?: (blockerUserId: string, blockedUserId: string) => Promise<boolean>;
};

const FALLBACK_AUTHOR: Omit<FriendPostAuthorSummary, "userId"> = {
  displayName: "Użytkownik",
  handle: null,
  avatarRef: null,
};

async function buildAuthor(deps: Deps, viewerUserId: string, authorUserId: string): Promise<FriendPostAuthorSummary> {
  const res = await deps.identity.getPublicProfile(viewerUserId, authorUserId);
  if (!res.ok) return { userId: authorUserId, ...FALLBACK_AUTHOR };
  const p = res.value;
  return {
    userId: authorUserId,
    displayName: p.displayName,
    handle: p.profileSlug ?? null,
    avatarRef: p.avatarMediaRef?.assetId ?? null,
  };
}

async function buildAuthorMap(
  deps: Deps,
  viewerUserId: string,
  posts: readonly FriendPostDTO[],
): Promise<Map<string, FriendPostAuthorSummary>> {
  const map = new Map<string, FriendPostAuthorSummary>();
  for (const p of posts) {
    if (map.has(p.authorUserId)) continue;
    map.set(p.authorUserId, await buildAuthor(deps, viewerUserId, p.authorUserId));
  }
  return map;
}

async function buildCommentAuthorMap(
  deps: Deps,
  viewerUserId: string,
  comments: readonly { authorUserId: string }[],
): Promise<Map<string, FriendPostAuthorSummary>> {
  const map = new Map<string, FriendPostAuthorSummary>();
  for (const c of comments) {
    if (map.has(c.authorUserId)) continue;
    map.set(c.authorUserId, await buildAuthor(deps, viewerUserId, c.authorUserId));
  }
  return map;
}

async function isFriend(deps: Deps, viewerUserId: string, otherUserId: string): Promise<boolean> {
  if (viewerUserId === otherUserId) return false;
  const friendIds = await getFriendIdsForViewer(deps, viewerUserId);
  return friendIds.includes(otherUserId);
}

async function getFriendIdsForViewer(
  deps: Deps,
  viewerUserId: string,
): Promise<readonly string[]> {
  const social = deps.social as SocialWithFriendIds;
  if (typeof social.getFriendIdsForViewer === "function") {
    return social.getFriendIdsForViewer(viewerUserId);
  }
  const friends = await deps.social.listFriends(viewerUserId as never);
  return friends.map((f) => f.friendId as unknown as string);
}

async function isBlockedEitherWay(
  deps: Deps,
  viewerUserId: string,
  ownerUserId: string,
): Promise<boolean> {
  const social = deps.social as SocialWithFriendIds;
  if (typeof social.isBlocked !== "function") return false;
  const [viewerBlockedOwner, ownerBlockedViewer] = await Promise.all([
    social.isBlocked(viewerUserId, ownerUserId),
    social.isBlocked(ownerUserId, viewerUserId),
  ]);
  return viewerBlockedOwner || ownerBlockedViewer;
}

function toItemView(
  post: FriendPostDTO,
  author: FriendPostAuthorSummary,
  viewerUserId: string,
  viewerIsFriendOfAuthor: boolean,
  interactionSummary: FriendFeedItemViewDTO["interactionSummary"],
): FriendFeedItemViewDTO {
  const viewerIsAuthor = post.authorUserId === viewerUserId;
  const interactionAllowed = viewerIsAuthor || viewerIsFriendOfAuthor;
  return {
    postId: post.id,
    author,
    body: post.body,
    mediaRefs: post.mediaRefs,
    visibility: post.visibility,
    status: post.status === "edited" ? "edited" : "published",
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    viewerCanComment: interactionAllowed,
    viewerCanReact: interactionAllowed,
    viewerIsAuthor,
    interactionSummary,
  };
}

async function enrichComments(
  deps: Deps,
  viewerUserId: string,
  friendPostId: string,
  cursor?: string | null,
  limit?: number,
): Promise<FriendPostsResult<FriendFeedCommentListViewDTO>> {
  const res = await deps.friendPosts.listComments({ friendPostId, cursor, limit }, viewerUserId);
  if (!res.ok) return res;
  const authors = await buildCommentAuthorMap(deps, viewerUserId, res.value.items);
  return {
    ok: true,
    value: {
      items: res.value.items.map((comment) => ({
        id: comment.id,
        friendPostId: comment.friendPostId,
        author: authors.get(comment.authorUserId) ?? { userId: comment.authorUserId, ...FALLBACK_AUTHOR },
        body: comment.status === "deactivated" ? "" : comment.body,
        status: comment.status,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        viewerCanEdit: comment.authorUserId === viewerUserId && comment.status !== "deactivated",
        viewerCanDelete: comment.authorUserId === viewerUserId && comment.status !== "deactivated",
      })),
      nextCursor: res.value.nextCursor,
    },
  };
}

export function createFriendFeedUseCaseV2(deps: FriendFeedUseCaseDeps): FriendFeedUseCaseV2 {
  return {
    async createFriendFeedPost(input) {
      const command: CreateFriendPostCommand = {
        authorUserId: input.viewerUserId,
        body: input.body,
        mediaRefs: input.mediaRefs,
        visibility: input.visibility,
      };
      return deps.friendPosts.createPost(command);
    },

    async updateOwnFriendPost(input) {
      const command: UpdateFriendPostInput = {
        friendPostId: input.friendPostId,
        actorUserId: input.viewerUserId,
        body: input.body,
        visibility: input.visibility,
      };
      return deps.friendPosts.updatePost(command);
    },

    async deactivateOwnFriendPost(input) {
      const command: DeactivateFriendPostInput = {
        friendPostId: input.friendPostId,
        actorUserId: input.viewerUserId,
      };
      return deps.friendPosts.deactivatePost(command);
    },

    async listFriendFeed(input) {
      const raw = await deps.friendPosts.listFriendFeedRaw({
        viewerUserId: input.viewerUserId,
        cursor: input.cursor ?? null,
        limit: input.limit,
      });
      const authors = await buildAuthorMap(deps, input.viewerUserId, raw.items);
      const friendSet = new Set(await getFriendIdsForViewer(deps, input.viewerUserId));
      const summaryRes = await deps.friendPosts.getInteractionSummary({
        viewerUserId: input.viewerUserId,
        friendPostIds: raw.items.map((p) => p.id),
      });
      const summaries = new Map(
        summaryRes.ok ? summaryRes.value.map((summary) => [summary.friendPostId, summary]) : [],
      );
      const items: FriendFeedItemViewDTO[] = raw.items.map((post) =>
        toItemView(
          post,
          authors.get(post.authorUserId)!,
          input.viewerUserId,
          friendSet.has(post.authorUserId),
          summaries.get(post.id) ?? {
            friendPostId: post.id,
            commentCount: 0,
            reactionSummary: { targetType: "friend_post", targetId: post.id, likeCount: 0 },
            viewerReactionState: { targetType: "friend_post", targetId: post.id, viewerLiked: false },
          },
        ),
      );
      return { items, nextCursor: raw.nextCursor };
    },

    async getPersonalProfileFriendFeedPreview(input) {
      const limit = Math.min(input.limit ?? PROFILE_PREVIEW_DEFAULT_LIMIT, PROFILE_PREVIEW_MAX_LIMIT);
      let viewerRelation: "owner" | "friend" | "stranger";
      if (input.viewerUserId === input.profileOwnerId) viewerRelation = "owner";
      else if (
        await isBlockedEitherWay(
          deps,
          input.viewerUserId,
          input.profileOwnerId,
        )
      ) {
        viewerRelation = "stranger";
      }
      else if (await isFriend(deps, input.viewerUserId, input.profileOwnerId)) viewerRelation = "friend";
      else viewerRelation = "stranger";

      const authorPosts = await deps.friendPosts.listAuthorFeedRaw(input.profileOwnerId, limit + 1);
      const author = await buildAuthor(deps, input.viewerUserId, input.profileOwnerId);
      const viewerIsFriend = viewerRelation === "friend";
      const visible = authorPosts.filter((p) => {
        if (viewerRelation === "owner") return p.status === "published" || p.status === "edited";
        if (p.visibility === "private") return false;
        if (p.visibility === "public") return true;
        return viewerIsFriend;
      });
      const restrictedReason: PersonalProfileFriendFeedPreviewViewDTO["restrictedReason"] =
        visible.length === 0 && viewerRelation === "stranger" ? "not_friends" : "none";

      const items = visible.slice(0, limit).map((post) =>
        toItemView(post, author, input.viewerUserId, viewerIsFriend, {
          friendPostId: post.id,
          commentCount: 0,
          reactionSummary: { targetType: "friend_post", targetId: post.id, likeCount: 0 },
          viewerReactionState: { targetType: "friend_post", targetId: post.id, viewerLiked: false },
        }),
      );
      const hasMore = visible.length > limit;
      return {
        profileOwnerId: input.profileOwnerId,
        viewerRelation,
        items,
        hasMore,
        restrictedReason,
        ctaTargetRoute: "/friends-feed",
      };
    },

    async createFriendPostComment(input) {
      const created = await deps.friendPosts.createComment({
        friendPostId: input.friendPostId,
        authorUserId: input.viewerUserId,
        body: input.body,
      });
      if (!created.ok) return created;
      return enrichComments(deps, input.viewerUserId, input.friendPostId);
    },

    async listFriendPostComments(input) {
      return enrichComments(deps, input.viewerUserId, input.friendPostId, input.cursor, input.limit);
    },

    async updateOwnFriendPostComment(input) {
      const updated = await deps.friendPosts.updateComment({
        commentId: input.commentId,
        actorUserId: input.viewerUserId,
        body: input.body,
      });
      if (!updated.ok) return updated;
      return enrichComments(deps, input.viewerUserId, input.friendPostId);
    },

    async deactivateOwnFriendPostComment(input) {
      const deleted = await deps.friendPosts.deleteComment({
        commentId: input.commentId,
        actorUserId: input.viewerUserId,
      });
      if (!deleted.ok) return deleted;
      return enrichComments(deps, input.viewerUserId, input.friendPostId);
    },

    reactToFriendPost(input) {
      return deps.friendPosts.toggleReaction({
        friendPostId: input.friendPostId,
        actorUserId: input.viewerUserId,
        mode: input.mode,
      });
    },

    reactToFriendPostComment(input) {
      return deps.friendPosts.reactToComment({
        commentId: input.commentId,
        actorUserId: input.viewerUserId,
        mode: input.mode,
      });
    },

    getFriendFeedInteractionSummary(input) {
      return deps.friendPosts.getInteractionSummary(input);
    },

    async getFriendFeedComposerState(input) {
      const friendIds = await getFriendIdsForViewer(deps, input.viewerUserId);
      const hasFriends = friendIds.length > 0;
      return {
        canPublish: true,
        disabledReason: hasFriends ? "none" : "no_friends",
        defaultVisibility: "friends_only",
        supportedVisibilities: ["friends_only", "private", "public"],
      };
    },
  };
}
