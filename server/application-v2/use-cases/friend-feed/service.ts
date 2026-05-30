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
}

type Deps = FriendFeedUseCaseDeps;

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

async function isFriend(deps: Deps, viewerUserId: string, otherUserId: string): Promise<boolean> {
  if (viewerUserId === otherUserId) return false;
  const friends = await deps.social.listFriends(viewerUserId as never);
  return friends.some((f) => f.friendId === otherUserId);
}

function toItemView(
  post: FriendPostDTO,
  author: FriendPostAuthorSummary,
  viewerUserId: string,
  viewerIsFriendOfAuthor: boolean,
): FriendFeedItemViewDTO {
  const viewerIsAuthor = post.authorUserId === viewerUserId;
  const interactionAllowed = viewerIsAuthor || viewerIsFriendOfAuthor || post.visibility === "public";
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
      const friends = await deps.social.listFriends(input.viewerUserId as never);
      const friendSet = new Set(friends.map((f) => f.friendId as unknown as string));
      const items: FriendFeedItemViewDTO[] = raw.items.map((post) =>
        toItemView(
          post,
          authors.get(post.authorUserId)!,
          input.viewerUserId,
          friendSet.has(post.authorUserId),
        ),
      );
      return { items, nextCursor: raw.nextCursor };
    },

    async getPersonalProfileFriendFeedPreview(input) {
      const limit = Math.min(input.limit ?? PROFILE_PREVIEW_DEFAULT_LIMIT, PROFILE_PREVIEW_MAX_LIMIT);
      let viewerRelation: "owner" | "friend" | "stranger";
      if (input.viewerUserId === input.profileOwnerId) viewerRelation = "owner";
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
        toItemView(post, author, input.viewerUserId, viewerIsFriend),
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

    async getFriendFeedComposerState(input) {
      const friends = await deps.social.listFriends(input.viewerUserId as never);
      const hasFriends = friends.length > 0;
      return {
        canPublish: true,
        disabledReason: hasFriends ? "none" : "no_friends",
        defaultVisibility: "friends_only",
        supportedVisibilities: ["friends_only", "private", "public"],
      };
    },
  };
}
