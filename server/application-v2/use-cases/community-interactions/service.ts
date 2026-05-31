// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * application-v2/use-cases/community-interactions — orchestrator for comments
 * and reactions under community feed items (Slice 6).
 *
 * Composes communities-v2 (roles + feed settings + policy) with content-v2
 * (comments + reactions + feed items). This layer owns NO data and bypasses
 * NO domain policy. Both backends are reachable ONLY through their public-api
 * — no cross-domain internals. Interactions are anchored to a specific
 * feedItemId so propagated copies keep their interactions LOCAL — staff_only
 * posts in descendant communities never leak comments back up the tree.
 */
import type {
  CommunitiesService,
  CommunityFeedSettingsDTO,
  CommunityFeedSettingsService,
  CommunityRole,
} from "@server/domains-v2/communities-v2/public-api";
import {
  canViewCommunityAll,
  canViewRelational,
  canViewStaffOnly,
} from "@server/domains-v2/communities-v2/public-api";
import type {
  CommentDTO,
  CommentService,
  CommunityFeedItemDTO,
  CommunityFeedService,
  ReactionService,
  ReactionSummaryDTO,
  ReactionTargetType,
  ViewerReactionStateDTO,
} from "@server/domains-v2/content-v2/public-api";
import type {
  CommunityCommentInteractionSummaryDTO,
  CommunityInteractionsErrorCode,
  CommunityInteractionsResult,
  CommunityPostInteractionSummaryDTO,
  CommunityPostInteractionSummaryQuery,
  CreateCommunityPostCommentCommand,
  DeleteCommunityCommentCommand,
  ListCommunityPostCommentsQuery,
  ListCommunityPostCommentsResultDTO,
  ReactToCommunityCommentCommand,
  ReactToCommunityCommentResult,
  ReactToCommunityPostCommand,
  ReactToCommunityPostResult,
  UpdateCommunityCommentCommand,
} from "./types";

export type CommunityInteractionsUseCaseDeps = {
  communities: CommunitiesService;
  feedSettings: CommunityFeedSettingsService;
  content: CommunityFeedService;
  comments: CommentService;
  reactions: ReactionService;
};

export interface CommunityInteractionsUseCase {
  createCommunityPostComment(command: CreateCommunityPostCommentCommand): Promise<CommunityInteractionsResult<{ comment: CommentDTO }>>;
  updateCommunityComment(command: UpdateCommunityCommentCommand): Promise<CommunityInteractionsResult<{ comment: CommentDTO }>>;
  deleteCommunityComment(command: DeleteCommunityCommentCommand): Promise<CommunityInteractionsResult<{ comment: CommentDTO }>>;
  listCommunityPostComments(query: ListCommunityPostCommentsQuery): Promise<CommunityInteractionsResult<ListCommunityPostCommentsResultDTO>>;
  reactToCommunityPost(command: ReactToCommunityPostCommand): Promise<CommunityInteractionsResult<ReactToCommunityPostResult>>;
  reactToCommunityComment(command: ReactToCommunityCommentCommand): Promise<CommunityInteractionsResult<ReactToCommunityCommentResult>>;
  getCommunityPostInteractionSummary(query: CommunityPostInteractionSummaryQuery): Promise<CommunityInteractionsResult<readonly CommunityPostInteractionSummaryDTO[]>>;
}

type Deps = CommunityInteractionsUseCaseDeps;
type Role = CommunityRole | null;

function fail<T>(code: CommunityInteractionsErrorCode, message: string): CommunityInteractionsResult<T> {
  return { ok: false, error: { code, message } };
}

function canViewFeed(role: Role, settings: CommunityFeedSettingsDTO, feedType: CommunityFeedItemDTO["feedType"]): boolean {
  if (feedType === "community_all") return canViewCommunityAll(role, settings);
  if (feedType === "relational") return canViewRelational(role, settings);
  return canViewStaffOnly(role, settings);
}

async function loadItemAndAccess(
  deps: Deps,
  feedItemId: string,
  actorUserId: string,
): Promise<CommunityInteractionsResult<{ item: CommunityFeedItemDTO; role: Role; settings: CommunityFeedSettingsDTO }>> {
  const item = await deps.content.getFeedItem(feedItemId);
  if (!item) return fail("FEED_ITEM_NOT_FOUND", "Post nie istnieje w tym feedzie.");
  const roleRes = await deps.communities.getViewerRole(item.communityId, actorUserId);
  if (!roleRes.ok) return fail("NOT_FOUND", "Community not found.");
  const settingsRes = await deps.feedSettings.getCommunityFeedSettings(item.communityId);
  if (!settingsRes.ok) return fail("NOT_FOUND", "Community not found.");
  if (!canViewFeed(roleRes.value, settingsRes.value, item.feedType)) {
    return fail("FORBIDDEN", "Nie masz dostępu do tego feedu.");
  }
  return { ok: true, value: { item, role: roleRes.value, settings: settingsRes.value } };
}

function canInteract(role: Role, settings: CommunityFeedSettingsDTO, feedType: CommunityFeedItemDTO["feedType"]): boolean {
  if (role === null) return false; // stranger never comments/reacts
  return canViewFeed(role, settings, feedType);
}

async function createCommunityPostComment(deps: Deps, command: CreateCommunityPostCommentCommand): Promise<CommunityInteractionsResult<{ comment: CommentDTO }>> {
  const ctx = await loadItemAndAccess(deps, command.feedItemId, command.actorUserId);
  if (!ctx.ok) return ctx;
  if (!canInteract(ctx.value.role, ctx.value.settings, ctx.value.item.feedType)) {
    return fail("FORBIDDEN", "Nie możesz komentować w tym feedzie.");
  }
  const res = await deps.comments.createComment({
    feedItemId: command.feedItemId,
    authorUserId: command.actorUserId,
    body: command.body,
    parentCommentId: command.parentCommentId ?? null,
  });
  if (!res.ok) return fail(res.error.code, res.error.message);
  return { ok: true, value: { comment: res.value.comment } };
}

async function updateCommunityComment(deps: Deps, command: UpdateCommunityCommentCommand): Promise<CommunityInteractionsResult<{ comment: CommentDTO }>> {
  const ctx = await loadItemAndAccess(deps, command.feedItemId, command.actorUserId);
  if (!ctx.ok) return ctx;
  const res = await deps.comments.updateOwnComment({ commentId: command.commentId, actorUserId: command.actorUserId, body: command.body });
  if (!res.ok) return fail(res.error.code, res.error.message);
  return { ok: true, value: { comment: res.value.comment } };
}

async function deleteCommunityComment(deps: Deps, command: DeleteCommunityCommentCommand): Promise<CommunityInteractionsResult<{ comment: CommentDTO }>> {
  const ctx = await loadItemAndAccess(deps, command.feedItemId, command.actorUserId);
  if (!ctx.ok) return ctx;
  const res = await deps.comments.deleteOwnComment({ commentId: command.commentId, actorUserId: command.actorUserId });
  if (!res.ok) return fail(res.error.code, res.error.message);
  return { ok: true, value: { comment: res.value.comment } };
}

async function listCommunityPostComments(deps: Deps, query: ListCommunityPostCommentsQuery): Promise<CommunityInteractionsResult<ListCommunityPostCommentsResultDTO>> {
  const ctx = await loadItemAndAccess(deps, query.feedItemId, query.actorUserId);
  if (!ctx.ok) return ctx;
  const page = await deps.comments.listComments({ feedItemId: query.feedItemId, cursor: query.cursor, limit: query.limit });
  if (page.items.length === 0) {
    return { ok: true, value: { items: page.items, nextCursor: page.nextCursor, reactions: [] } };
  }
  const targets = page.items.map((c) => ({ targetType: "comment" as ReactionTargetType, targetId: c.id }));
  const sum = await deps.reactions.getReactionSummaries({ targets });
  const viewer = await deps.reactions.getViewerReactionState({ userId: query.actorUserId, targets });
  const reactions: CommunityCommentInteractionSummaryDTO[] = page.items.map((c, i) => ({
    commentId: c.id,
    reactions: sum.summaries[i],
    viewer: viewer.states[i],
  }));
  return { ok: true, value: { items: page.items, nextCursor: page.nextCursor, reactions } };
}

async function applyReactionMode(
  deps: Deps,
  targetType: ReactionTargetType,
  targetId: string,
  actorUserId: string,
  reactionType: "like",
  mode: "set" | "remove" | "toggle",
): Promise<CommunityInteractionsResult<{ active: boolean }>> {
  if (mode === "set") {
    const res = await deps.reactions.setReaction({ targetType, targetId, userId: actorUserId, reactionType });
    if (!res.ok) return fail(res.error.code, res.error.message);
    return { ok: true, value: { active: true } };
  }
  if (mode === "remove") {
    const res = await deps.reactions.removeReaction({ targetType, targetId, userId: actorUserId, reactionType });
    if (!res.ok) return fail(res.error.code, res.error.message);
    return { ok: true, value: { active: false } };
  }
  const res = await deps.reactions.toggleReaction({ targetType, targetId, userId: actorUserId, reactionType });
  if (!res.ok) return fail(res.error.code, res.error.message);
  return { ok: true, value: { active: res.value.active } };
}

async function reactionAfterState(
  deps: Deps,
  targetType: ReactionTargetType,
  targetId: string,
  actorUserId: string,
): Promise<{ reactions: ReactionSummaryDTO; viewer: ViewerReactionStateDTO }> {
  const t = [{ targetType, targetId }];
  const sum = await deps.reactions.getReactionSummaries({ targets: t });
  const viewer = await deps.reactions.getViewerReactionState({ userId: actorUserId, targets: t });
  return { reactions: sum.summaries[0], viewer: viewer.states[0] };
}

async function reactToCommunityPost(deps: Deps, command: ReactToCommunityPostCommand): Promise<CommunityInteractionsResult<ReactToCommunityPostResult>> {
  const ctx = await loadItemAndAccess(deps, command.feedItemId, command.actorUserId);
  if (!ctx.ok) return ctx;
  if (!canInteract(ctx.value.role, ctx.value.settings, ctx.value.item.feedType)) {
    return fail("FORBIDDEN", "Nie możesz reagować w tym feedzie.");
  }
  const applied = await applyReactionMode(deps, "post", command.feedItemId, command.actorUserId, command.reactionType, command.mode);
  if (!applied.ok) return applied as unknown as CommunityInteractionsResult<ReactToCommunityPostResult>;
  const after = await reactionAfterState(deps, "post", command.feedItemId, command.actorUserId);
  return { ok: true, value: { active: applied.value.active, reactions: after.reactions, viewer: after.viewer } };
}

async function reactToCommunityComment(deps: Deps, command: ReactToCommunityCommentCommand): Promise<CommunityInteractionsResult<ReactToCommunityCommentResult>> {
  const ctx = await loadItemAndAccess(deps, command.feedItemId, command.actorUserId);
  if (!ctx.ok) return ctx;
  if (!canInteract(ctx.value.role, ctx.value.settings, ctx.value.item.feedType)) {
    return fail("FORBIDDEN", "Nie możesz reagować w tym feedzie.");
  }
  const applied = await applyReactionMode(deps, "comment", command.commentId, command.actorUserId, command.reactionType, command.mode);
  if (!applied.ok) return applied as unknown as CommunityInteractionsResult<ReactToCommunityCommentResult>;
  const after = await reactionAfterState(deps, "comment", command.commentId, command.actorUserId);
  return { ok: true, value: { active: applied.value.active, reactions: after.reactions, viewer: after.viewer } };
}

async function getCommunityPostInteractionSummary(
  deps: Deps,
  query: CommunityPostInteractionSummaryQuery,
): Promise<CommunityInteractionsResult<readonly CommunityPostInteractionSummaryDTO[]>> {
  if (query.feedItemIds.length === 0) return { ok: true, value: [] };
  // Look up each item once; filter to those the actor can view. Items the
  // actor cannot see are dropped from the summary (no leak of staff_only
  // reaction counts or comment counts to a plain member).
  const visible: CommunityFeedItemDTO[] = [];
  for (const id of query.feedItemIds) {
    const item = await deps.content.getFeedItem(id);
    if (!item) continue;
    const roleRes = await deps.communities.getViewerRole(item.communityId, query.actorUserId);
    if (!roleRes.ok) continue;
    const settingsRes = await deps.feedSettings.getCommunityFeedSettings(item.communityId);
    if (!settingsRes.ok) continue;
    if (!canViewFeed(roleRes.value, settingsRes.value, item.feedType)) continue;
    visible.push(item);
  }
  if (visible.length === 0) return { ok: true, value: [] };
  const ids = visible.map((i) => i.id);
  const counts = await deps.comments.countActiveBatch(ids);
  const targets = visible.map((i) => ({ targetType: "post" as ReactionTargetType, targetId: i.id }));
  const sum = await deps.reactions.getReactionSummaries({ targets });
  const viewer = await deps.reactions.getViewerReactionState({ userId: query.actorUserId, targets });
  const result: CommunityPostInteractionSummaryDTO[] = visible.map((item, i) => ({
    feedItemId: item.id,
    commentCount: counts.get(item.id) ?? 0,
    reactions: sum.summaries[i],
    viewer: viewer.states[i],
  }));
  return { ok: true, value: result };
}

export function createCommunityInteractionsUseCase(deps: Deps): CommunityInteractionsUseCase {
  return {
    createCommunityPostComment: (c) => createCommunityPostComment(deps, c),
    updateCommunityComment: (c) => updateCommunityComment(deps, c),
    deleteCommunityComment: (c) => deleteCommunityComment(deps, c),
    listCommunityPostComments: (q) => listCommunityPostComments(deps, q),
    reactToCommunityPost: (c) => reactToCommunityPost(deps, c),
    reactToCommunityComment: (c) => reactToCommunityComment(deps, c),
    getCommunityPostInteractionSummary: (q) => getCommunityPostInteractionSummary(deps, q),
  };
}
