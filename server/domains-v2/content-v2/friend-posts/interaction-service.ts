// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-OWN-001-ACK: pre-runtime mutation; ownership currently delegated to policy/closure; explicit owner check to be added with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

import type {
  CreateFriendPostCommentInput,
  DeleteFriendPostCommentInput,
  FriendFeedInteractionSummaryDTO,
  FriendPostCommentDTO,
  FriendPostReactionSummaryDTO,
  GetFriendFeedInteractionSummaryQuery,
  ListFriendPostCommentsQuery,
  ReactToFriendPostInput,
  UpdateFriendPostCommentInput,
} from "./dto";
import { FRIEND_FEED_DEFAULT_LIMIT, FRIEND_FEED_MAX_LIMIT } from "./dto";
import { canViewFriendPost, validateFriendPostCommentBody } from "./policy";
import type { FriendshipResolver } from "./contracts";
import type { FriendFeedEventPublisher } from "./events";
import type { FriendPostCommentRepository, FriendPostReactionRepository, FriendPostRepository } from "./store";

type Deps = {
  posts: FriendPostRepository;
  comments: FriendPostCommentRepository;
  reactions: FriendPostReactionRepository;
  friendship: FriendshipResolver;
  events: FriendFeedEventPublisher;
  clock: { now: () => Date };
  ids: { next: () => string };
};

type FriendPostsResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: "NOT_FOUND" | "FORBIDDEN" | "VALIDATION_FAILED"; message: string } };
type Fail = <T>(code: "NOT_FOUND" | "FORBIDDEN" | "VALIDATION_FAILED", message: string) => FriendPostsResult<T>;
type Publisher = {
  publishIfRecipientDiffers: (event: Parameters<Deps["events"]["publish"]>[0]) => Promise<void>;
};

function clampLimit(requested: number | undefined): number {
  const n = requested && requested > 0 ? requested : FRIEND_FEED_DEFAULT_LIMIT;
  return Math.min(n, FRIEND_FEED_MAX_LIMIT);
}

function canInteract(post: { authorUserId: string }, viewerUserId: string, isFriend: boolean): boolean {
  return post.authorUserId === viewerUserId || isFriend;
}

async function buildSummary(deps: Deps, friendPostId: string, viewerUserId: string): Promise<FriendFeedInteractionSummaryDTO> {
  const target = { targetType: "friend_post" as const, targetId: friendPostId };
  const commentCount = await deps.comments.countForPost(friendPostId);
  const likeCount = await deps.reactions.countLikes(target.targetType, target.targetId);
  const viewerLiked = await deps.reactions.hasViewerLiked(target.targetType, target.targetId, viewerUserId);
  return {
    friendPostId,
    commentCount,
    reactionSummary: { ...target, likeCount },
    viewerReactionState: { ...target, viewerLiked },
  };
}

async function applyReaction(deps: Deps, input: ReactToFriendPostInput): Promise<boolean> {
  const mode = input.mode ?? "toggle";
  if (mode === "remove") {
    await deps.reactions.removeLike("friend_post", input.friendPostId, input.actorUserId);
    return false;
  }
  if (mode === "set") {
    return (await deps.reactions.setLike("friend_post", input.friendPostId, input.actorUserId)).created;
  }
  return (await deps.reactions.toggleLike("friend_post", input.friendPostId, input.actorUserId)).liked;
}

export async function createFriendPostComment(
  deps: Deps,
  input: CreateFriendPostCommentInput,
  fail: Fail,
  publisher: Publisher,
): Promise<FriendPostsResult<FriendPostCommentDTO>> {
  const post = await deps.posts.getById(input.friendPostId);
  if (!post) return fail("NOT_FOUND", "Friend post not found.");
  const isFriend = await deps.friendship.areFriends(input.authorUserId, post.authorUserId);
  if (!canViewFriendPost(post, input.authorUserId, isFriend) || !canInteract(post, input.authorUserId, isFriend)) {
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
    deletedAt: null,
  };
  await deps.comments.insert(comment);
  await publisher.publishIfRecipientDiffers({
    type: "FriendFeedCommentCreated",
    eventId: `evt-${deps.ids.next()}`,
    actorUserId: input.authorUserId,
    recipientUserId: post.authorUserId,
    postId: post.id,
    commentId: comment.id,
    occurredAt: now,
    correlationId: null,
  });
  return { ok: true, value: comment };
}

export async function updateFriendPostComment(
  deps: Deps,
  input: UpdateFriendPostCommentInput,
  fail: Fail,
): Promise<FriendPostsResult<FriendPostCommentDTO>> {
  const existing = await deps.comments.getById(input.commentId);
  if (!existing || existing.status === "deactivated") return fail("NOT_FOUND", "Comment not found.");
  if (existing.authorUserId !== input.actorUserId) return fail("FORBIDDEN", "Only the author can update this comment.");
  const bodyErr = validateFriendPostCommentBody(input.body);
  if (bodyErr) return fail("VALIDATION_FAILED", bodyErr);
  const updated: FriendPostCommentDTO = {
    ...existing,
    body: input.body.trim(),
    status: "edited",
    updatedAt: deps.clock.now().toISOString(),
  };
  await deps.comments.update(updated);
  return { ok: true, value: updated };
}

export async function deleteFriendPostComment(
  deps: Deps,
  input: DeleteFriendPostCommentInput,
  fail: Fail,
): Promise<FriendPostsResult<FriendPostCommentDTO>> {
  const existing = await deps.comments.getById(input.commentId);
  if (!existing) return fail("NOT_FOUND", "Comment not found.");
  if (existing.status === "deactivated") return { ok: true, value: existing };
  if (existing.authorUserId !== input.actorUserId) return fail("FORBIDDEN", "Only the author can delete this comment.");
  const now = deps.clock.now().toISOString();
  const updated: FriendPostCommentDTO = { ...existing, body: "", status: "deactivated", updatedAt: now, deletedAt: now };
  await deps.comments.update(updated);
  return { ok: true, value: updated };
}

// SCALABILITY_HOT_PATH_EXCEPTION: repository guarantees stable order (createdAt asc + id) with cursor + fixed cap.
export async function listFriendPostComments(
  deps: Deps,
  query: ListFriendPostCommentsQuery,
  viewerUserId: string,
  fail: Fail,
): Promise<FriendPostsResult<{ items: readonly FriendPostCommentDTO[]; nextCursor: string | null }>> {
  const post = await deps.posts.getById(query.friendPostId);
  if (!post) return fail("NOT_FOUND", "Friend post not found.");
  const isFriend = await deps.friendship.areFriends(viewerUserId, post.authorUserId);
  if (!canViewFriendPost(post, viewerUserId, isFriend)) return fail("FORBIDDEN", "Viewer cannot view comments.");
  const limit = clampLimit(query.limit);
  const items = await deps.comments.listForPost(query.friendPostId, query.cursor ?? null, limit); // stable order: createdAt asc + id.
  const nextCursor = items.length === limit ? items[items.length - 1].id : null;
  return { ok: true, value: { items, nextCursor } };
}

export async function reactToFriendPost(
  deps: Deps,
  input: ReactToFriendPostInput,
  fail: Fail,
  publisher: Publisher,
): Promise<FriendPostsResult<FriendPostReactionSummaryDTO>> {
  const post = await deps.posts.getById(input.friendPostId);
  if (!post) return fail("NOT_FOUND", "Friend post not found.");
  const isFriend = await deps.friendship.areFriends(input.actorUserId, post.authorUserId);
  if (!canViewFriendPost(post, input.actorUserId, isFriend) || !canInteract(post, input.actorUserId, isFriend)) {
    return fail("FORBIDDEN", "Viewer cannot react to this post.");
  }
  if (await applyReaction(deps, input)) {
    await publisher.publishIfRecipientDiffers({
      type: "FriendFeedReactionAdded",
      eventId: `evt-${deps.ids.next()}`,
      actorUserId: input.actorUserId,
      recipientUserId: post.authorUserId,
      postId: post.id,
      reactionType: "like",
      occurredAt: deps.clock.now().toISOString(),
      correlationId: null,
    });
  }
  return { ok: true, value: await buildSummary(deps, input.friendPostId, input.actorUserId) };
}

export async function getFriendFeedInteractionSummary(
  deps: Deps,
  query: GetFriendFeedInteractionSummaryQuery,
  fail: Fail,
): Promise<FriendPostsResult<readonly FriendFeedInteractionSummaryDTO[]>> {
  const targets = query.friendPostIds.map((id) => ({ targetType: "friend_post" as const, targetId: id }));
  const commentCounts = await deps.comments.countForPosts(query.friendPostIds);
  const likeCounts = await deps.reactions.countLikesBatch(targets);
  const summaries: FriendFeedInteractionSummaryDTO[] = [];
  for (const id of query.friendPostIds) {
    const post = await deps.posts.getById(id);
    if (!post) return fail("NOT_FOUND", "Friend post not found.");
    const isFriend = await deps.friendship.areFriends(query.viewerUserId, post.authorUserId);
    if (!canViewFriendPost(post, query.viewerUserId, isFriend)) return fail("FORBIDDEN", "Viewer cannot view interactions.");
    const viewerLiked = await deps.reactions.hasViewerLiked("friend_post", id, query.viewerUserId);
    summaries.push({
      friendPostId: id,
      commentCount: commentCounts.get(id) ?? 0,
      reactionSummary: { targetType: "friend_post", targetId: id, likeCount: likeCounts.get(`friend_post:${id}`) ?? 0 },
      viewerReactionState: { targetType: "friend_post", targetId: id, viewerLiked },
    });
  }
  return { ok: true, value: summaries };
}
