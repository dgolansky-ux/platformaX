// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * application-v2/use-cases/channel-interactions — orchestrates channel post
 * comments/reactions through channels + content-v2 public APIs only.
 */
import type {
  ChannelLeadPermission,
  ChannelsService,
} from "@server/domains-v2/channels/public-api";
import {
  canCommentOnChannelPost,
  canModerateChannelComment,
  canReactToChannelPost,
  canUpdateChannelInteractionSettings,
  canViewChannelFeed,
} from "@server/domains-v2/channels/public-api";
import type {
  ChannelCommentDTO,
  ChannelCommentService,
} from "@server/domains-v2/content-v2/channel-comments/public-api";
import type {
  ChannelReactionService,
  ChannelReactionTargetType,
  ChannelReactionType,
} from "@server/domains-v2/content-v2/channel-reactions/public-api";
import type {
  ChannelPostDTO,
  ChannelPostService,
} from "@server/domains-v2/content-v2/channel-posts/public-api";
import type { IdentityService } from "@server/domains-v2/identity/public-api";
import type { CommunityAuthorityResolver } from "@server/domains-v2/communities-v2/contracts";
import type {
  ChannelCommentInteractionSummaryDTO,
  ChannelCommentViewDTO,
  ChannelInteractionSettingsViewDTO,
  ChannelInteractionsErrorCode,
  ChannelInteractionsResult,
  ChannelPostInteractionSummaryDTO,
  ChannelPostInteractionSummaryQuery,
  CreateChannelCommentCommand,
  DeactivateChannelCommentCommand,
  ListChannelPostCommentsQuery,
  ListChannelPostCommentsResultDTO,
  ReactToChannelCommentCommand,
  ReactToChannelPostCommand,
  ReactToChannelTargetResult,
  UpdateChannelCommentCommand,
  UpdateChannelInteractionSettingsCommand,
} from "./types";

export type ChannelInteractionsUseCaseDeps = {
  channels: ChannelsService;
  posts: ChannelPostService;
  comments: ChannelCommentService;
  reactions: ChannelReactionService;
  identity: Pick<IdentityService, "getPublicProfile">;
  authority: CommunityAuthorityResolver;
};

export interface ChannelInteractionsUseCase {
  createChannelPostComment(command: CreateChannelCommentCommand): Promise<ChannelInteractionsResult<{ comment: ChannelCommentViewDTO }>>;
  updateChannelPostComment(command: UpdateChannelCommentCommand): Promise<ChannelInteractionsResult<{ comment: ChannelCommentViewDTO }>>;
  deactivateChannelPostComment(command: DeactivateChannelCommentCommand): Promise<ChannelInteractionsResult<{ comment: ChannelCommentViewDTO }>>;
  listChannelPostComments(query: ListChannelPostCommentsQuery): Promise<ChannelInteractionsResult<ListChannelPostCommentsResultDTO>>;
  reactToChannelPost(command: ReactToChannelPostCommand): Promise<ChannelInteractionsResult<ReactToChannelTargetResult>>;
  reactToChannelComment(command: ReactToChannelCommentCommand): Promise<ChannelInteractionsResult<ReactToChannelTargetResult>>;
  getChannelPostInteractionSummary(query: ChannelPostInteractionSummaryQuery): Promise<ChannelInteractionsResult<readonly ChannelPostInteractionSummaryDTO[]>>;
  updateChannelInteractionSettings(command: UpdateChannelInteractionSettingsCommand): Promise<ChannelInteractionsResult<ChannelInteractionSettingsViewDTO>>;
}

type Deps = ChannelInteractionsUseCaseDeps;

function fail<T>(code: ChannelInteractionsErrorCode, message: string): ChannelInteractionsResult<T> {
  return { ok: false, error: { code, message } };
}

async function leadPermissions(deps: Deps, channelId: string, userId: string): Promise<readonly ChannelLeadPermission[]> {
  const leads = await deps.channels.listChannelLeads(channelId);
  if (!leads.ok) return [];
  return leads.value.find((lead) => lead.userId === userId && lead.status === "active")?.permissions ?? [];
}

async function viewerContext(deps: Deps, post: ChannelPostDTO, actorUserId: string) {
  const channel = await deps.channels.getPublicSummary(post.channelId);
  if (!channel) return null;
  const permissions = await leadPermissions(deps, post.channelId, actorUserId);
  const followed = (await deps.channels.listFollowedByUser(actorUserId)).some((c) => c.id === post.channelId);
  const isCommunityManager = await deps.authority.canManageCommunity(channel.ownerId, actorUserId);
  const isCommunityMember = await deps.authority.isCommunityMember(channel.ownerId, actorUserId);
  const canView = canViewChannelFeed({
    visibility: channel.visibility,
    viewerFollows: followed,
    viewerIsLead: permissions.length > 0,
    viewerIsCommunityManager: isCommunityManager,
  });
  const settings = await deps.channels.getInteractionSettings(post.channelId);
  if (!settings.ok) return null;
  return {
    channel,
    settings: settings.value,
    permissions,
    followed,
    isLead: permissions.length > 0,
    isCommunityMember,
    canView,
  };
}

async function loadPostContext(deps: Deps, channelPostId: string, actorUserId: string) {
  const post = await deps.posts.getById(channelPostId);
  if (!post) return fail<never>("NOT_FOUND", "Wpis kanału nie istnieje.");
  const ctx = await viewerContext(deps, post, actorUserId);
  if (!ctx) return fail<never>("NOT_FOUND", "Kanał nie istnieje.");
  if (!ctx.canView) return fail<never>("FORBIDDEN", "Brak dostępu do wpisu kanału.");
  return { ok: true as const, value: { post, ctx } };
}

async function decorateComment(deps: Deps, comment: ChannelCommentDTO, actorUserId: string, permissions: readonly ChannelLeadPermission[]): Promise<ChannelCommentViewDTO> {
  const profile = await deps.identity.getPublicProfile(null, comment.authorUserId);
  const canModerate = canModerateChannelComment(permissions);
  return {
    ...comment,
    authorPublicSummary: profile.ok ? {
      userId: profile.value.userId,
      displayName: profile.value.displayName,
      handle: profile.value.profileSlug,
      avatarRef: profile.value.avatarMediaRef?.assetId ?? null,
    } : null,
    viewerCanEdit: comment.authorUserId === actorUserId && comment.status !== "deactivated",
    viewerCanDeactivate: (comment.authorUserId === actorUserId || canModerate) && comment.status !== "deactivated",
    viewerCanModerate: canModerate && comment.status !== "deactivated",
  };
}

async function applyReactionMode(
  deps: Deps,
  targetType: ChannelReactionTargetType,
  targetId: string,
  actorUserId: string,
  reactionType: ChannelReactionType,
  mode: "set" | "remove" | "toggle",
): Promise<ChannelInteractionsResult<{ active: boolean }>> {
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

async function reactionAfterState(deps: Deps, targetType: ChannelReactionTargetType, targetId: string, actorUserId: string) {
  const target = [{ targetType, targetId }];
  const reactions = await deps.reactions.getReactionSummaries({ targets: target });
  const viewer = await deps.reactions.getViewerReactionState({ userId: actorUserId, targets: target });
  return { reactions: reactions.summaries[0], viewer: viewer.states[0] };
}

export function createChannelInteractionsUseCase(deps: Deps): ChannelInteractionsUseCase {
  return {
    async createChannelPostComment(command) {
      const loaded = await loadPostContext(deps, command.channelPostId, command.actorUserId);
      if (!loaded.ok) return loaded;
      const { ctx } = loaded.value;
      if (!canCommentOnChannelPost({
        settings: ctx.settings,
        viewerFollows: ctx.followed,
        viewerIsLead: ctx.isLead,
        viewerIsCommunityMember: ctx.isCommunityMember,
      })) {
        return fail("FORBIDDEN", "Nie możesz komentować tego wpisu kanału.");
      }
      const created = await deps.comments.create({
        channelPostId: command.channelPostId,
        authorUserId: command.actorUserId,
        body: command.body,
        parentCommentId: command.parentCommentId ?? null,
      });
      if (!created.ok) return fail(created.error.code, created.error.message);
      return { ok: true, value: { comment: await decorateComment(deps, created.value.comment, command.actorUserId, ctx.permissions) } };
    },
    async updateChannelPostComment(command) {
      const loaded = await loadPostContext(deps, command.channelPostId, command.actorUserId);
      if (!loaded.ok) return loaded;
      const res = await deps.comments.update({
        commentId: command.commentId,
        actorUserId: command.actorUserId,
        body: command.body,
        canModerate: canModerateChannelComment(loaded.value.ctx.permissions),
      });
      if (!res.ok) return fail(res.error.code, res.error.message);
      return { ok: true, value: { comment: await decorateComment(deps, res.value.comment, command.actorUserId, loaded.value.ctx.permissions) } };
    },
    async deactivateChannelPostComment(command) {
      const loaded = await loadPostContext(deps, command.channelPostId, command.actorUserId);
      if (!loaded.ok) return loaded;
      const res = await deps.comments.deactivate({
        commentId: command.commentId,
        actorUserId: command.actorUserId,
        moderationReason: command.moderationReason,
        canModerate: canModerateChannelComment(loaded.value.ctx.permissions),
      });
      if (!res.ok) return fail(res.error.code, res.error.message);
      return { ok: true, value: { comment: await decorateComment(deps, res.value.comment, command.actorUserId, loaded.value.ctx.permissions) } };
    },
    async listChannelPostComments(query) {
      const loaded = await loadPostContext(deps, query.channelPostId, query.actorUserId);
      if (!loaded.ok) return loaded;
      const page = await deps.comments.list({ channelPostId: query.channelPostId, cursor: query.cursor, limit: query.limit });
      const items = await Promise.all(page.items.map((comment) => decorateComment(deps, comment, query.actorUserId, loaded.value.ctx.permissions)));
      const targets = page.items.map((comment) => ({ targetType: "channel_comment" as const, targetId: comment.id }));
      const reactions = targets.length ? await deps.reactions.getReactionSummaries({ targets }) : { summaries: [] };
      const viewer = targets.length ? await deps.reactions.getViewerReactionState({ userId: query.actorUserId, targets }) : { states: [] };
      const summaries: ChannelCommentInteractionSummaryDTO[] = page.items.map((comment, index) => ({
        commentId: comment.id,
        reactions: reactions.summaries[index],
        viewer: viewer.states[index],
      }));
      return { ok: true, value: { items, nextCursor: page.nextCursor, reactions: summaries } };
    },
    async reactToChannelPost(command) {
      const loaded = await loadPostContext(deps, command.channelPostId, command.actorUserId);
      if (!loaded.ok) return loaded;
      if (!canReactToChannelPost({ settings: loaded.value.ctx.settings })) return fail("FORBIDDEN", "Reakcje pod tym wpisem są wyłączone.");
      const applied = await applyReactionMode(deps, "channel_post", command.channelPostId, command.actorUserId, command.reactionType, command.mode);
      if (!applied.ok) return applied;
      const after = await reactionAfterState(deps, "channel_post", command.channelPostId, command.actorUserId);
      return { ok: true, value: { active: applied.value.active, ...after } };
    },
    async reactToChannelComment(command) {
      const loaded = await loadPostContext(deps, command.channelPostId, command.actorUserId);
      if (!loaded.ok) return loaded;
      if (!canReactToChannelPost({ settings: loaded.value.ctx.settings })) return fail("FORBIDDEN", "Reakcje pod tym wpisem są wyłączone.");
      const comment = await deps.comments.getById(command.commentId);
      if (!comment || comment.channelPostId !== command.channelPostId) return fail("COMMENT_NOT_FOUND", "Komentarz nie istnieje.");
      if (comment.status === "deactivated") return fail("FORBIDDEN", "Nie można reagować na ukryty komentarz.");
      const applied = await applyReactionMode(deps, "channel_comment", command.commentId, command.actorUserId, command.reactionType, command.mode);
      if (!applied.ok) return applied;
      const after = await reactionAfterState(deps, "channel_comment", command.commentId, command.actorUserId);
      return { ok: true, value: { active: applied.value.active, ...after } };
    },
    async getChannelPostInteractionSummary(query: ChannelPostInteractionSummaryQuery) {
      const visible: ChannelPostDTO[] = [];
      for (const id of query.channelPostIds) {
        const loaded = await loadPostContext(deps, id, query.actorUserId);
        if (loaded.ok) visible.push(loaded.value.post);
      }
      if (visible.length === 0) return { ok: true, value: [] };
      const ids = visible.map((post) => post.id);
      const commentCounts = await deps.comments.countActiveBatch(ids);
      const targets = ids.map((id) => ({ targetType: "channel_post" as const, targetId: id }));
      const reactions = await deps.reactions.getReactionSummaries({ targets });
      const viewer = await deps.reactions.getViewerReactionState({ userId: query.actorUserId, targets });
      const summaries: ChannelPostInteractionSummaryDTO[] = ids.map((id, index) => ({
        channelPostId: id,
        commentCount: commentCounts.get(id) ?? 0,
        reactions: reactions.summaries[index],
        viewer: viewer.states[index],
      }));
      return { ok: true, value: summaries };
    },
    async updateChannelInteractionSettings(command) {
      const perms = await leadPermissions(deps, command.channelId, command.actorUserId);
      if (!canUpdateChannelInteractionSettings(perms)) return fail("FORBIDDEN", "Brak uprawnień do ustawień interakcji.");
      const updated = await deps.channels.updateInteractionSettings(command);
      if (!updated.ok) return fail(updated.error.code === "NOT_FOUND" ? "NOT_FOUND" : "FORBIDDEN", updated.error.message);
      return { ok: true, value: { ...updated.value, viewerCanUpdate: true } };
    },
  };
}
