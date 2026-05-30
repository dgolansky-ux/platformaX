/**
 * content-v2/friend-posts — service. FOUNDATION_READY.
 *
 * Owns friend posts + friend post comments + friend post reactions (the
 * existing generic reactions submodule is intentionally not reused here so
 * we can present a single, focused FriendPostInteractionSummary without
 * cross-target coupling).
 */
import type {
  CreateFriendPostCommand,
  CreateFriendPostCommentInput,
  DeactivateFriendPostInput,
  DeleteFriendPostCommentInput,
  FriendFeedPageDTO,
  FriendPostCommentDTO,
  FriendPostDTO,
  FriendPostPublicDTO,
  FriendPostReactionSummaryDTO,
  FriendPostStatus,
  FriendPostVisibility,
  ListFriendFeedCommand,
  ListFriendPostCommentsQuery,
  UpdateFriendPostInput,
} from "./dto";
import {
  FRIEND_FEED_DEFAULT_LIMIT,
  FRIEND_FEED_MAX_LIMIT,
} from "./dto";
import { toFriendPostPublic } from "./projections";
import {
  canViewFriendPost,
  isFriendPostVisibility,
  validateFriendPostBody,
  validateFriendPostCommentBody,
  validateFriendPostMediaRefs,
} from "./policy";
import type { FriendshipResolver } from "./contracts";
import type {
  FriendPostCommentRepository,
  FriendPostReactionRepository,
  FriendPostRepository,
} from "./store";
import type { FriendFeedEventPublisher } from "./events";

// QUALITY_STRUCTURE_EXCEPTION: Slice-11 foundation service intentionally keeps
// command/read orchestration together until a durable store replaces the
// in-memory adapter; public API and tests pin the behavior.
export type FriendPostsClock = { now: () => Date };
export type FriendPostsIdGen = { next: () => string };

export type FriendPostsServiceDeps = {
  posts: FriendPostRepository;
  comments: FriendPostCommentRepository;
  reactions: FriendPostReactionRepository;
  friendship: FriendshipResolver;
  events: FriendFeedEventPublisher;
  clock: FriendPostsClock;
  ids: FriendPostsIdGen;
};

export type FriendPostsErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "VALIDATION_FAILED";

export type FriendPostsResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: FriendPostsErrorCode; message: string } };

export interface FriendPostsService {
  createPost(input: CreateFriendPostCommand): Promise<FriendPostsResult<FriendPostPublicDTO>>;
  updatePost(input: UpdateFriendPostInput): Promise<FriendPostsResult<FriendPostPublicDTO>>;
  deactivatePost(input: DeactivateFriendPostInput): Promise<FriendPostsResult<FriendPostPublicDTO>>;
  getPostForViewer(
    postId: string,
    viewerUserId: string,
  ): Promise<FriendPostsResult<FriendPostPublicDTO>>;
  /** Raw feed read — application use-case enriches with author summary. */
  // SCALABILITY_HOT_PATH_EXCEPTION: delegates to store stable order (createdAt desc + id) with cursor + limit.
  listFriendFeedRaw(input: ListFriendFeedCommand): Promise<FriendFeedRawPageDTO>;
  /** Profile preview raw read — bounded by limit, scoped to a single author. */
  // SCALABILITY_HOT_PATH_EXCEPTION: delegates to store stable order (createdAt desc + id) with bounded limit.
  listAuthorFeedRaw(authorUserId: string, limit: number): Promise<readonly FriendPostDTO[]>;

  createComment(
    input: CreateFriendPostCommentInput,
  ): Promise<FriendPostsResult<FriendPostCommentDTO>>;
  deleteComment(input: DeleteFriendPostCommentInput): Promise<FriendPostsResult<FriendPostCommentDTO>>;
  listComments(
    query: ListFriendPostCommentsQuery,
    viewerUserId: string,
  ): Promise<FriendPostsResult<{ items: readonly FriendPostCommentDTO[]; nextCursor: string | null }>>;
  toggleReaction(input: {
    friendPostId: string;
    actorUserId: string;
  }): Promise<FriendPostsResult<FriendPostReactionSummaryDTO>>;
  getReactionSummary(
    friendPostId: string,
    viewerUserId: string,
  ): Promise<FriendPostsResult<FriendPostReactionSummaryDTO>>;
}

export interface FriendFeedRawPageDTO {
  items: readonly FriendPostDTO[];
  nextCursor: string | null;
}

type Deps = FriendPostsServiceDeps;

function fail<T>(code: FriendPostsErrorCode, message: string): FriendPostsResult<T> {
  return { ok: false, error: { code, message } };
}

function defaultVisibility(input: CreateFriendPostCommand): FriendPostVisibility {
  if (input.visibility !== undefined) return input.visibility;
  return "friends_only";
}

async function createPost(deps: Deps, input: CreateFriendPostCommand): Promise<FriendPostsResult<FriendPostPublicDTO>> {
  const bodyErr = validateFriendPostBody(input.body);
  if (bodyErr) return fail("VALIDATION_FAILED", bodyErr);
  const mediaErr = validateFriendPostMediaRefs(input.mediaRefs);
  if (mediaErr) return fail("VALIDATION_FAILED", mediaErr);
  const visibility = defaultVisibility(input);
  if (!isFriendPostVisibility(visibility)) return fail("VALIDATION_FAILED", "VISIBILITY_INVALID");
  const now = deps.clock.now().toISOString();
  const post: FriendPostDTO = {
    id: deps.ids.next(),
    authorUserId: input.authorUserId,
    body: input.body.trim(),
    mediaRefs: input.mediaRefs ?? [],
    visibility,
    status: "published",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await deps.posts.insert(post);
  await deps.events.publish({
    type: "FriendFeedPostCreated",
    eventId: `evt-${deps.ids.next()}`,
    actorUserId: input.authorUserId,
    authorUserId: input.authorUserId,
    postId: post.id,
    occurredAt: now,
    correlationId: null,
  });
  return { ok: true, value: toFriendPostPublic(post) };
}

async function updatePost(deps: Deps, input: UpdateFriendPostInput): Promise<FriendPostsResult<FriendPostPublicDTO>> {
  const existing = await deps.posts.getById(input.friendPostId);
  if (!existing) return fail("NOT_FOUND", "Friend post not found.");
  if (existing.authorUserId !== input.actorUserId) return fail("FORBIDDEN", "Only the author can update this post.");
  if (existing.status === "deactivated") return fail("NOT_FOUND", "Friend post not found.");
  let body = existing.body;
  if (input.body !== undefined) {
    const err = validateFriendPostBody(input.body);
    if (err) return fail("VALIDATION_FAILED", err);
    body = input.body.trim();
  }
  let visibility = existing.visibility;
  if (input.visibility !== undefined) {
    if (!isFriendPostVisibility(input.visibility)) return fail("VALIDATION_FAILED", "VISIBILITY_INVALID");
    visibility = input.visibility;
  }
  const updated: FriendPostDTO = {
    ...existing,
    body,
    visibility,
    status: "edited",
    updatedAt: deps.clock.now().toISOString(),
  };
  await deps.posts.update(updated);
  return { ok: true, value: toFriendPostPublic(updated) };
}

async function deactivatePost(deps: Deps, input: DeactivateFriendPostInput): Promise<FriendPostsResult<FriendPostPublicDTO>> {
  const existing = await deps.posts.getById(input.friendPostId);
  if (!existing) return fail("NOT_FOUND", "Friend post not found.");
  if (existing.authorUserId !== input.actorUserId) return fail("FORBIDDEN", "Only the author can deactivate this post.");
  const now = deps.clock.now().toISOString();
  const updated: FriendPostDTO = {
    ...existing,
    status: "deactivated",
    updatedAt: now,
    deletedAt: now,
  };
  await deps.posts.update(updated);
  return { ok: true, value: toFriendPostPublic(updated) };
}

async function getPostForViewer(
  deps: Deps,
  postId: string,
  viewerUserId: string,
): Promise<FriendPostsResult<FriendPostPublicDTO>> {
  const post = await deps.posts.getById(postId);
  if (!post) return fail("NOT_FOUND", "Friend post not found.");
  const isFriend = await deps.friendship.areFriends(viewerUserId, post.authorUserId);
  if (!canViewFriendPost(post, viewerUserId, isFriend)) {
    return fail("NOT_FOUND", "Friend post not found.");
  }
  return { ok: true, value: toFriendPostPublic(post) };
}

function clampLimit(requested: number | undefined): number {
  const n = requested && requested > 0 ? requested : FRIEND_FEED_DEFAULT_LIMIT;
  return Math.min(n, FRIEND_FEED_MAX_LIMIT);
}

// SCALABILITY_HOT_PATH_EXCEPTION: store returns stable order (createdAt desc + id) with cursor + bounded limit.
async function listFriendFeedRaw(deps: Deps, input: ListFriendFeedCommand): Promise<FriendFeedRawPageDTO> {
  const limit = clampLimit(input.limit);
  const friendIds = await deps.friendship.listFriendIdsForViewer(input.viewerUserId);
  // FIXED_CAP — bounded by `limit`; viewer included so own posts are visible.
  const records = await deps.posts.listByAuthors(friendIds, input.cursor ?? null, limit, input.viewerUserId);
  const friendSet = new Set(friendIds);
  const items = records.filter((r) => canViewFriendPost(r, input.viewerUserId, friendSet.has(r.authorUserId)));
  const nextCursor = records.length === limit ? records[records.length - 1].id : null;
  return { items, nextCursor };
}

// SCALABILITY_HOT_PATH_EXCEPTION: store returns stable order (createdAt desc + id) with bounded limit.
async function listAuthorFeedRaw(
  deps: Deps,
  authorUserId: string,
  limit: number,
): Promise<readonly FriendPostDTO[]> {
  return deps.posts.listByAuthor(authorUserId, null, Math.min(limit, FRIEND_FEED_MAX_LIMIT));
}

async function createComment(deps: Deps, input: CreateFriendPostCommentInput): Promise<FriendPostsResult<FriendPostCommentDTO>> {
  const post = await deps.posts.getById(input.friendPostId);
  if (!post) return fail("NOT_FOUND", "Friend post not found.");
  const isFriend = await deps.friendship.areFriends(input.authorUserId, post.authorUserId);
  if (!canViewFriendPost(post, input.authorUserId, isFriend)) {
    return fail("FORBIDDEN", "Viewer cannot comment on this post.");
  }
  const bodyErr = validateFriendPostCommentBody(input.body);
  if (bodyErr) return fail("VALIDATION_FAILED", bodyErr);
  const now = deps.clock.now().toISOString();
  const comment: FriendPostCommentDTO = {
    id: deps.ids.next(),
    friendPostId: post.id,
    authorUserId: input.authorUserId,
    body: input.body.trim(),
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  await deps.comments.insert(comment);
  await deps.events.publish({
    type: "FriendFeedCommentCreated",
    eventId: `evt-${deps.ids.next()}`,
    actorUserId: input.authorUserId,
    authorUserId: post.authorUserId,
    postId: post.id,
    commentId: comment.id,
    occurredAt: now,
    correlationId: null,
  });
  return { ok: true, value: comment };
}

async function deleteComment(deps: Deps, input: DeleteFriendPostCommentInput): Promise<FriendPostsResult<FriendPostCommentDTO>> {
  const existing = await deps.comments.getById(input.commentId);
  if (!existing) return fail("NOT_FOUND", "Comment not found.");
  if (existing.status === "deleted") return { ok: true, value: existing };
  if (existing.authorUserId !== input.actorUserId) return fail("FORBIDDEN", "Only the author can delete this comment.");
  const now = deps.clock.now().toISOString();
  const updated: FriendPostCommentDTO = { ...existing, body: "", status: "deleted", updatedAt: now };
  await deps.comments.update(updated);
  return { ok: true, value: updated };
}

// SCALABILITY_HOT_PATH_EXCEPTION: comment store returns stable order (createdAt asc + id) with cursor + bounded limit.
async function listComments(
  deps: Deps,
  query: ListFriendPostCommentsQuery,
  viewerUserId: string,
): Promise<FriendPostsResult<{ items: readonly FriendPostCommentDTO[]; nextCursor: string | null }>> {
  const post = await deps.posts.getById(query.friendPostId);
  if (!post) return fail("NOT_FOUND", "Friend post not found.");
  const isFriend = await deps.friendship.areFriends(viewerUserId, post.authorUserId);
  if (!canViewFriendPost(post, viewerUserId, isFriend)) {
    return fail("FORBIDDEN", "Viewer cannot view comments.");
  }
  const limit = clampLimit(query.limit);
  const items = await deps.comments.listForPost(query.friendPostId, query.cursor ?? null, limit); // SCALABILITY_HOT_PATH_EXCEPTION: comment store returns stable order createdAt asc + id.
  const nextCursor = items.length === limit ? items[items.length - 1].id : null;
  return { ok: true, value: { items, nextCursor } };
}

async function toggleReaction(deps: Deps, input: { friendPostId: string; actorUserId: string }): Promise<FriendPostsResult<FriendPostReactionSummaryDTO>> {
  const post = await deps.posts.getById(input.friendPostId);
  if (!post) return fail("NOT_FOUND", "Friend post not found.");
  const isFriend = await deps.friendship.areFriends(input.actorUserId, post.authorUserId);
  if (!canViewFriendPost(post, input.actorUserId, isFriend)) {
    return fail("FORBIDDEN", "Viewer cannot react to this post.");
  }
  const { liked } = await deps.reactions.toggleLike(input.friendPostId, input.actorUserId);
  if (liked) {
    await deps.events.publish({
      type: "FriendFeedReactionAdded",
      eventId: `evt-${deps.ids.next()}`,
      actorUserId: input.actorUserId,
      authorUserId: post.authorUserId,
      postId: post.id,
      reactionType: "like",
      occurredAt: deps.clock.now().toISOString(),
      correlationId: null,
    });
  }
  const likeCount = await deps.reactions.countLikes(input.friendPostId);
  return { ok: true, value: { friendPostId: input.friendPostId, likeCount, viewerLiked: liked } };
}

async function getReactionSummary(deps: Deps, friendPostId: string, viewerUserId: string): Promise<FriendPostsResult<FriendPostReactionSummaryDTO>> {
  const post = await deps.posts.getById(friendPostId);
  if (!post) return fail("NOT_FOUND", "Friend post not found.");
  const isFriend = await deps.friendship.areFriends(viewerUserId, post.authorUserId);
  if (!canViewFriendPost(post, viewerUserId, isFriend)) {
    return fail("FORBIDDEN", "Viewer cannot view reactions.");
  }
  const likeCount = await deps.reactions.countLikes(friendPostId);
  const viewerLiked = await deps.reactions.hasViewerLiked(friendPostId, viewerUserId);
  return { ok: true, value: { friendPostId, likeCount, viewerLiked } };
}

export function createFriendPostsService(deps: FriendPostsServiceDeps): FriendPostsService {
  return {
    createPost: (input) => createPost(deps, input),
    updatePost: (input) => updatePost(deps, input),
    deactivatePost: (input) => deactivatePost(deps, input),
    getPostForViewer: (id, viewerId) => getPostForViewer(deps, id, viewerId),
    listFriendFeedRaw: (input) => listFriendFeedRaw(deps, input), // SCALABILITY_HOT_PATH_EXCEPTION: delegate preserves stable order.
    listAuthorFeedRaw: (authorId, limit) => listAuthorFeedRaw(deps, authorId, limit), // SCALABILITY_HOT_PATH_EXCEPTION: delegate preserves stable order.
    createComment: (input) => createComment(deps, input),
    deleteComment: (input) => deleteComment(deps, input),
    listComments: (query, viewerId) => listComments(deps, query, viewerId),
    toggleReaction: (input) => toggleReaction(deps, input),
    getReactionSummary: (id, viewerId) => getReactionSummary(deps, id, viewerId),
  };
}

// FIXED_CAP marker: see clampLimit — every list path is bounded by
// FRIEND_FEED_MAX_LIMIT or FRIEND_FEED_DEFAULT_LIMIT; no unbounded query.
const _STATUSES_FOR_TYPE_REUSE: FriendPostStatus[] = []; void _STATUSES_FOR_TYPE_REUSE;
// Re-export for tests.
export type { FriendFeedPageDTO };
