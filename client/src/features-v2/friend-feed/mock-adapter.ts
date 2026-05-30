/**
 * features-v2/friend-feed — MOCK_LOCAL_ONLY transport.
 *
 * Mirrors the V2 friend-feed rules in-memory (no @server/* imports). The
 * adapter seeds a small friend graph + sample posts so the UI shows realistic
 * empty / loading / list states without ever touching localStorage.
 */
import type {
  CreateCommentInputUi,
  CreateFriendPostInputUi,
  FriendFeedAdapterResult,
  FriendFeedAuthorUi,
  FriendFeedComposerStateUi,
  FriendFeedItemUi,
  FriendFeedPageUi,
  FriendFeedVisibility,
  FriendPostCommentUi,
  PersonalProfileFriendFeedPreviewUi,
  ToggleReactionInputUi,
} from "./types";

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
  status: "active" | "deleted";
  createdAt: string;
}

interface ReactionRow {
  postId: string;
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
  },
];

const REACTIONS: ReactionRow[] = [
  { postId: "fp-1", userId: "u-viewer" },
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

function countLikes(postId: string): number {
  return REACTIONS.filter((r) => r.postId === postId).length;
}

function viewerLiked(postId: string, viewerId: string): boolean {
  return REACTIONS.some((r) => r.postId === postId && r.userId === viewerId);
}

function countComments(postId: string): number {
  return COMMENTS.filter((c) => c.postId === postId && c.status === "active").length;
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
  const canInteract = viewerIsAuthor || friendOfAuthor || post.visibility === "public";
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
    likeCount: countLikes(post.id),
    viewerLiked: viewerLiked(post.id, viewerId),
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
    const post = POSTS.find((p) => p.id === input.postId);
    if (!post) return fail("NOT_FOUND", "Wpis nie istnieje.");
    if (!canView(post, input.viewerUserId)) return fail("FORBIDDEN", "Nie możesz reagować na ten wpis.");
    const idx = REACTIONS.findIndex((r) => r.postId === input.postId && r.userId === input.viewerUserId);
    let liked: boolean;
    if (idx === -1) {
      REACTIONS.push({ postId: input.postId, userId: input.viewerUserId });
      liked = true;
    } else {
      REACTIONS.splice(idx, 1);
      liked = false;
    }
    return { ok: true, value: { likeCount: countLikes(input.postId), viewerLiked: liked } };
  },

  async listComments(viewerUserId: string, postId: string): Promise<FriendFeedAdapterResult<readonly FriendPostCommentUi[]>> {
    const post = POSTS.find((p) => p.id === postId);
    if (!post) return fail("NOT_FOUND", "Wpis nie istnieje.");
    if (!canView(post, viewerUserId)) return fail("FORBIDDEN", "Nie możesz zobaczyć komentarzy.");
    const items = COMMENTS.filter((c) => c.postId === postId).map((c) => ({
      id: c.id,
      postId: c.postId,
      author: AUTHORS[c.authorUserId] ?? { userId: c.authorUserId, displayName: "Użytkownik", handle: null, avatarRef: null },
      body: c.status === "deleted" ? "" : c.body,
      status: c.status,
      createdAt: c.createdAt,
    }));
    return { ok: true, value: items };
  },

  async createComment(input: CreateCommentInputUi): Promise<FriendFeedAdapterResult<FriendPostCommentUi>> {
    const post = POSTS.find((p) => p.id === input.postId);
    if (!post) return fail("NOT_FOUND", "Wpis nie istnieje.");
    if (!canView(post, input.viewerUserId)) return fail("FORBIDDEN", "Nie możesz komentować tego wpisu.");
    const trimmed = input.body.trim();
    if (trimmed.length === 0) return fail("VALIDATION_FAILED", "Treść nie może być pusta.");
    const comment: CommentRow = {
      id: `fc-${++seq}`,
      postId: input.postId,
      authorUserId: input.viewerUserId,
      body: trimmed,
      status: "active",
      createdAt: new Date().toISOString(),
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
      },
    };
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
    });
    REACTIONS.push({ postId: "fp-1", userId: "u-viewer" });
  },
};
