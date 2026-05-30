/**
 * features-v2/friend-feed — MOCK_LOCAL_ONLY transport.
 *
 * Mirrors the V2 friend-feed rules in-memory (no @server/* imports). The
 * adapter seeds a small friend graph + sample posts so the UI shows realistic
 * empty / loading / list states without ever touching localStorage.
 */
import type {
  FriendFeedAdapterResult,
  FriendFeedAuthorUi,
  FriendFeedComposerStateUi,
  FriendFeedItemUi,
  FriendFeedPageUi,
  FriendFeedVisibility,
  FriendFeedWorkplaceTeaserItemUi,
  FriendFeedWorkplaceTeaserPageUi,
  FriendPostCommentUi,
  PersonalProfileFriendFeedPreviewUi,
} from "./types";

type CreateFriendPostInputUi = {
  viewerUserId: string;
  body: string;
  visibility: FriendFeedVisibility;
};

type ToggleReactionInputUi = {
  viewerUserId: string;
  postId?: string;
  commentId?: string;
  targetType?: "friend_post" | "friend_post_comment";
};

type CreateCommentInputUi = {
  viewerUserId: string;
  postId: string;
  body: string;
};

type UpdateCommentInputUi = {
  viewerUserId: string;
  postId: string;
  commentId: string;
  body: string;
};

type DeleteCommentInputUi = {
  viewerUserId: string;
  postId: string;
  commentId: string;
};

interface PostRow {
  id: string;
  authorUserId: string;
  body: string;
  visibility: FriendFeedVisibility;
  status: "published" | "edited" | "deactivated";
  createdAt: string;
  mediaRefs: readonly string[];
}

interface CommentRow {
  id: string;
  postId: string;
  authorUserId: string;
  body: string;
  status: "active" | "edited" | "deactivated";
  createdAt: string;
  updatedAt: string;
}

interface ReactionRow {
  targetType: "friend_post" | "friend_post_comment";
  targetId: string;
  userId: string;
}

const FRIEND_GRAPH: Record<string, readonly string[]> = {
  "u-viewer": ["u-ada", "u-kuba"],
  "u-ada": ["u-viewer", "u-kuba"],
  "u-kuba": ["u-viewer", "u-ada"],
  "u-stranger": [],
};

const AUTHORS: Record<string, FriendFeedAuthorUi> = {
  "u-viewer": { userId: "u-viewer", displayName: "Ty", handle: "viewer", avatarRef: null },
  "u-ada":    { userId: "u-ada", displayName: "Ada Demo", handle: "ada", avatarRef: null },
  "u-kuba":   { userId: "u-kuba", displayName: "Kuba Demo", handle: "kuba", avatarRef: null },
  "u-stranger": { userId: "u-stranger", displayName: "Obcy", handle: null, avatarRef: null },
};

let seq = 100;
let nextId = () => `fp-${++seq}`;

const POSTS: PostRow[] = [
  {
    id: "fp-1",
    authorUserId: "u-ada",
    body: "Pierwszy wpis Ady — czytam nową książkę o produktach.",
    visibility: "friends_only",
    status: "published",
    createdAt: "2026-05-29T08:00:00Z",
    mediaRefs: [],
  },
  {
    id: "fp-2",
    authorUserId: "u-kuba",
    body: "Kuba wstał wcześnie i poszedł pobiegać.",
    visibility: "friends_only",
    status: "published",
    createdAt: "2026-05-29T09:15:00Z",
    mediaRefs: [],
  },
  {
    id: "fp-3",
    authorUserId: "u-viewer",
    body: "Mój wpis: testuję feed znajomych.",
    visibility: "friends_only",
    status: "published",
    createdAt: "2026-05-30T07:00:00Z",
    mediaRefs: [],
  },
];

const COMMENTS: CommentRow[] = [
  {
    id: "fc-1",
    postId: "fp-1",
    authorUserId: "u-viewer",
    body: "Super, daj znać jaka książka!",
    status: "active",
    createdAt: "2026-05-29T08:15:00Z",
    updatedAt: "2026-05-29T08:15:00Z",
  },
];

const REACTIONS: ReactionRow[] = [
  { targetType: "friend_post", targetId: "fp-1", userId: "u-viewer" },
];

const WORKPLACE_TEASERS: FriendFeedWorkplaceTeaserItemUi[] = [
  {
    teaser: {
      id: "wt-1",
      sourcePostId: "wpost-1",
      workplaceId: "wp-1",
      workplaceName: "Coach Dawid",
      workplaceSlug: "coach-dawid",
      ownerUserId: "u-viewer",
      previewText: "Pierwszy wpis w mikro-feedzie miejsca pracy — wystartowałem nowy program coachingowy.",
      previewMediaRef: null,
      visibility: "public",
      createdAt: "2026-05-26T09:00:00Z",
      targetRoute: "/profile/workplaces/coach-dawid/posts/wpost-1",
    },
    owner: AUTHORS["u-viewer"],
  },
];

function areFriends(viewerId: string, otherId: string): boolean {
  if (viewerId === otherId) return false;
  return (FRIEND_GRAPH[viewerId] ?? []).includes(otherId);
}

function canView(post: PostRow, viewerId: string): boolean {
  if (post.status === "deactivated") return false;
  if (post.authorUserId === viewerId) return true;
  if (post.visibility === "public") return true;
  if (post.visibility === "friends_only") return areFriends(viewerId, post.authorUserId);
  return false;
}

function countLikes(targetType: "friend_post" | "friend_post_comment", targetId: string): number {
  return REACTIONS.filter((r) => r.targetType === targetType && r.targetId === targetId).length;
}

function viewerLiked(targetType: "friend_post" | "friend_post_comment", targetId: string, viewerId: string): boolean {
  return REACTIONS.some((r) => r.targetType === targetType && r.targetId === targetId && r.userId === viewerId);
}

function countComments(postId: string): number {
  return COMMENTS.filter((c) => c.postId === postId && c.status !== "deactivated").length;
}

function toFeedItem(post: PostRow, viewerId: string): FriendFeedItemUi {
  const author = AUTHORS[post.authorUserId] ?? {
    userId: post.authorUserId,
    displayName: "Użytkownik",
    handle: null,
    avatarRef: null,
  };
  const viewerIsAuthor = post.authorUserId === viewerId;
  const friendOfAuthor = areFriends(viewerId, post.authorUserId);
  const canInteract = viewerIsAuthor || friendOfAuthor;
  return {
    postId: post.id,
    author,
    body: post.body,
    mediaRefs: post.mediaRefs,
    visibility: post.visibility,
    status: post.status === "edited" ? "edited" : "published",
    createdAt: post.createdAt,
    updatedAt: post.createdAt,
    viewerCanComment: canInteract,
    viewerCanReact: canInteract,
    viewerIsAuthor,
    likeCount: countLikes("friend_post", post.id),
    viewerLiked: viewerLiked("friend_post", post.id, viewerId),
    commentCount: countComments(post.id),
  };
}

function newestFirst(a: PostRow, b: PostRow): number {
  if (a.createdAt === b.createdAt) return a.id < b.id ? 1 : -1;
  return a.createdAt < b.createdAt ? 1 : -1;
}

function fail<T>(code: "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_FAILED", message: string): FriendFeedAdapterResult<T> {
  return { ok: false, error: { code, message } };
}

export const friendFeedMockAdapter = {
  async listFeed(viewerUserId: string, cursor: string | null, limit: number): Promise<FriendFeedAdapterResult<FriendFeedPageUi>> {
    const friendSet = new Set([...(FRIEND_GRAPH[viewerUserId] ?? []), viewerUserId]);
    const candidates = POSTS.filter(
      (p) => friendSet.has(p.authorUserId) && canView(p, viewerUserId),
    ).sort(newestFirst);
    const start = cursor ? candidates.findIndex((p) => p.id === cursor) + 1 : 0;
    const slice = candidates.slice(start, start + limit);
    const items = slice.map((p) => toFeedItem(p, viewerUserId));
    const nextCursor = slice.length === limit ? slice[slice.length - 1].id : null;
    return { ok: true, value: { items, nextCursor } };
  },

  async createPost(input: CreateFriendPostInputUi): Promise<FriendFeedAdapterResult<FriendFeedItemUi>> {
    const trimmed = input.body.trim();
    if (trimmed.length === 0) return fail("VALIDATION_FAILED", "Treść nie może być pusta.");
    const post: PostRow = {
      id: nextId(),
      authorUserId: input.viewerUserId,
      body: trimmed,
      visibility: input.visibility,
      status: "published",
      createdAt: new Date().toISOString(),
      mediaRefs: [],
    };
    POSTS.push(post);
    return { ok: true, value: toFeedItem(post, input.viewerUserId) };
  },

  async toggleReaction(input: ToggleReactionInputUi): Promise<FriendFeedAdapterResult<{ likeCount: number; viewerLiked: boolean }>> {
    const targetType = input.targetType ?? "friend_post";
    const targetId = targetType === "friend_post_comment" ? input.commentId : input.postId;
    if (!targetId) return fail("VALIDATION_FAILED", "Brak celu reakcji.");
    const post = targetType === "friend_post"
      ? POSTS.find((p) => p.id === targetId)
      : POSTS.find((p) => p.id === COMMENTS.find((c) => c.id === targetId)?.postId);
    if (!post) return fail("NOT_FOUND", "Wpis nie istnieje.");
    if (!canView(post, input.viewerUserId)) return fail("FORBIDDEN", "Nie możesz reagować na ten wpis.");
    if (post.authorUserId !== input.viewerUserId && !areFriends(input.viewerUserId, post.authorUserId)) {
      return fail("FORBIDDEN", "Nie możesz reagować na ten wpis.");
    }
    const idx = REACTIONS.findIndex(
      (r) => r.targetType === targetType && r.targetId === targetId && r.userId === input.viewerUserId,
    );
    let liked: boolean;
    if (idx === -1) {
      REACTIONS.push({ targetType, targetId, userId: input.viewerUserId });
      liked = true;
    } else {
      REACTIONS.splice(idx, 1);
      liked = false;
    }
    return { ok: true, value: { likeCount: countLikes(targetType, targetId), viewerLiked: liked } };
  },

  async listComments(viewerUserId: string, postId: string): Promise<FriendFeedAdapterResult<readonly FriendPostCommentUi[]>> {
    const post = POSTS.find((p) => p.id === postId);
    if (!post) return fail("NOT_FOUND", "Wpis nie istnieje.");
    if (!canView(post, viewerUserId)) return fail("FORBIDDEN", "Nie możesz zobaczyć komentarzy.");
    const items = COMMENTS.filter((c) => c.postId === postId).map((c) => ({
      id: c.id,
      postId: c.postId,
      author: AUTHORS[c.authorUserId] ?? { userId: c.authorUserId, displayName: "Użytkownik", handle: null, avatarRef: null },
      body: c.status === "deactivated" ? "" : c.body,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      viewerCanEdit: c.authorUserId === viewerUserId && c.status !== "deactivated",
      viewerCanDelete: c.authorUserId === viewerUserId && c.status !== "deactivated",
      likeCount: countLikes("friend_post_comment", c.id),
      viewerLiked: viewerLiked("friend_post_comment", c.id, viewerUserId),
    }));
    return { ok: true, value: items };
  },

  async createComment(input: CreateCommentInputUi): Promise<FriendFeedAdapterResult<FriendPostCommentUi>> {
    const post = POSTS.find((p) => p.id === input.postId);
    if (!post) return fail("NOT_FOUND", "Wpis nie istnieje.");
    if (!canView(post, input.viewerUserId)) return fail("FORBIDDEN", "Nie możesz komentować tego wpisu.");
    if (post.authorUserId !== input.viewerUserId && !areFriends(input.viewerUserId, post.authorUserId)) {
      return fail("FORBIDDEN", "Nie możesz komentować tego wpisu.");
    }
    const trimmed = input.body.trim();
    if (trimmed.length === 0) return fail("VALIDATION_FAILED", "Treść nie może być pusta.");
    const now = new Date().toISOString();
    const comment: CommentRow = {
      id: `fc-${++seq}`,
      postId: input.postId,
      authorUserId: input.viewerUserId,
      body: trimmed,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    COMMENTS.push(comment);
    return {
      ok: true,
      value: {
        id: comment.id,
        postId: comment.postId,
        author: AUTHORS[comment.authorUserId] ?? { userId: comment.authorUserId, displayName: "Użytkownik", handle: null, avatarRef: null },
        body: comment.body,
        status: "active",
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        viewerCanEdit: true,
        viewerCanDelete: true,
        likeCount: 0,
        viewerLiked: false,
      },
    };
  },

  async updateComment(input: UpdateCommentInputUi): Promise<FriendFeedAdapterResult<readonly FriendPostCommentUi[]>> {
    const comment = COMMENTS.find((c) => c.id === input.commentId && c.postId === input.postId);
    if (!comment) return fail("NOT_FOUND", "Komentarz nie istnieje.");
    if (comment.status === "deactivated") return fail("NOT_FOUND", "Komentarz nie istnieje.");
    if (comment.authorUserId !== input.viewerUserId) return fail("FORBIDDEN", "Możesz edytować tylko własny komentarz.");
    const trimmed = input.body.trim();
    if (trimmed.length === 0) return fail("VALIDATION_FAILED", "Treść nie może być pusta.");
    comment.body = trimmed;
    comment.status = "edited";
    comment.updatedAt = new Date().toISOString();
    return this.listComments(input.viewerUserId, input.postId);
  },

  async deleteComment(input: DeleteCommentInputUi): Promise<FriendFeedAdapterResult<readonly FriendPostCommentUi[]>> {
    const comment = COMMENTS.find((c) => c.id === input.commentId && c.postId === input.postId);
    if (!comment) return fail("NOT_FOUND", "Komentarz nie istnieje.");
    if (comment.authorUserId !== input.viewerUserId) return fail("FORBIDDEN", "Możesz usuwać tylko własny komentarz.");
    comment.body = "";
    comment.status = "deactivated";
    comment.updatedAt = new Date().toISOString();
    return this.listComments(input.viewerUserId, input.postId);
  },

  async getComposerState(viewerUserId: string): Promise<FriendFeedAdapterResult<FriendFeedComposerStateUi>> {
    const hasFriends = (FRIEND_GRAPH[viewerUserId] ?? []).length > 0;
    return {
      ok: true,
      value: {
        canPublish: true,
        disabledReason: hasFriends ? "none" : "no_friends",
        defaultVisibility: "friends_only",
        supportedVisibilities: ["friends_only", "private", "public"],
      },
    };
  },

  /**
   * Friend-feed view of workplace mini-teasers.
   *
   * Each teaser is a smaller projection than a full post: short preview only,
   * no full body, no contact data. Visibility is enforced against the viewer's
   * friend graph: `friends_only` teasers are shown only when the viewer is a
   * confirmed friend of the workplace owner; `public` teasers are shown to
   * any viewer; the owner always sees own teasers.
   */
  async listWorkplaceTeasersForViewer(
    viewerUserId: string,
  ): Promise<FriendFeedAdapterResult<FriendFeedWorkplaceTeaserPageUi>> {
    const visible = WORKPLACE_TEASERS.filter((item) => {
      if (item.teaser.ownerUserId === viewerUserId) return true;
      if (item.teaser.visibility === "public") return areFriends(viewerUserId, item.teaser.ownerUserId);
      return areFriends(viewerUserId, item.teaser.ownerUserId);
    });
    return { ok: true, value: { items: visible, nextCursor: null } };
  },

  async getProfilePreview(
    viewerUserId: string,
    profileOwnerId: string,
    limit = 4,
  ): Promise<FriendFeedAdapterResult<PersonalProfileFriendFeedPreviewUi>> {
    let viewerRelation: "owner" | "friend" | "stranger";
    if (viewerUserId === profileOwnerId) viewerRelation = "owner";
    else if (areFriends(viewerUserId, profileOwnerId)) viewerRelation = "friend";
    else viewerRelation = "stranger";

    const allByOwner = POSTS.filter((p) => p.authorUserId === profileOwnerId && p.status !== "deactivated")
      .sort(newestFirst);
    const visible = allByOwner.filter((p) => {
      if (viewerRelation === "owner") return true;
      if (p.visibility === "private") return false;
      if (p.visibility === "public") return true;
      return viewerRelation === "friend";
    });
    const restrictedReason: PersonalProfileFriendFeedPreviewUi["restrictedReason"] =
      visible.length === 0 && viewerRelation === "stranger" ? "not_friends" : "none";
    const items = visible.slice(0, limit).map((p) => toFeedItem(p, viewerUserId));
    return {
      ok: true,
      value: {
        profileOwnerId,
        viewerRelation,
        items,
        hasMore: visible.length > limit,
        restrictedReason,
        ctaTargetRoute: "/friends-feed",
      },
    };
  },

  __resetForTests(): void {
    POSTS.length = 0;
    COMMENTS.length = 0;
    REACTIONS.length = 0;
    seq = 100;
    nextId = () => `fp-${++seq}`;
    POSTS.push(
      {
        id: "fp-1",
        authorUserId: "u-ada",
        body: "Pierwszy wpis Ady — czytam nową książkę o produktach.",
        visibility: "friends_only",
        status: "published",
        createdAt: "2026-05-29T08:00:00Z",
        mediaRefs: [],
      },
      {
        id: "fp-2",
        authorUserId: "u-kuba",
        body: "Kuba wstał wcześnie i poszedł pobiegać.",
        visibility: "friends_only",
        status: "published",
        createdAt: "2026-05-29T09:15:00Z",
        mediaRefs: [],
      },
      {
        id: "fp-3",
        authorUserId: "u-viewer",
        body: "Mój wpis: testuję feed znajomych.",
        visibility: "friends_only",
        status: "published",
        createdAt: "2026-05-30T07:00:00Z",
        mediaRefs: [],
      },
    );
    COMMENTS.push({
      id: "fc-1",
      postId: "fp-1",
      authorUserId: "u-viewer",
      body: "Super, daj znać jaka książka!",
      status: "active",
      createdAt: "2026-05-29T08:15:00Z",
      updatedAt: "2026-05-29T08:15:00Z",
    });
    REACTIONS.push({ targetType: "friend_post", targetId: "fp-1", userId: "u-viewer" });
  },
};
