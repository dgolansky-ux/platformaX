// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-OBS-003-ACK: pre-runtime use-case; request-context tracing wiring scheduled with RequestContext slice. EXC-016.
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * application-v2/use-cases/channel-content — Channels Slice 8 orchestration.
 *
 * Channels owns lead permissions and follow state. content-v2 owns channel
 * posts/feed/pinning. This use-case composes both through public-api only.
 */
import type {
  ChannelLeadPermission,
  ChannelsService,
} from "@server/domains-v2/channels/public-api";
import {
  canManageChannelContent,
  canPinChannelPost,
  canPublishChannelContent,
  canViewChannelFeed,
} from "@server/domains-v2/channels/public-api";
import type {
  ChannelPostService,
  ChannelPostDTO,
} from "@server/domains-v2/content-v2/channel-posts/public-api";
import type { IdentityService } from "@server/domains-v2/identity/public-api";
import type { CommunityAuthorityResolver } from "@server/domains-v2/communities-v2/contracts";
import type {
  ChannelContentResult,
  ChannelFeedView,
  ChannelFeedViewItem,
  ChannelPageView,
  ChannelPostActionCommand,
  ChannelSummary,
  CreateChannelPostCommand,
  ListChannelFeedQuery,
  UpdateChannelPostCommand,
} from "./types";

export type ChannelContentUseCaseDeps = {
  channels: ChannelsService;
  posts: ChannelPostService;
  identity: Pick<IdentityService, "getPublicProfile">;
  authority: CommunityAuthorityResolver;
};

export interface ChannelContentUseCase {
  createChannelPost(command: CreateChannelPostCommand): Promise<ChannelContentResult<ChannelPostDTO>>;
  updateChannelPost(command: UpdateChannelPostCommand): Promise<ChannelContentResult<ChannelPostDTO>>;
  deactivateChannelPost(command: ChannelPostActionCommand): Promise<ChannelContentResult<{ deactivated: true }>>;
  pinChannelPost(command: ChannelPostActionCommand): Promise<ChannelContentResult<ChannelPostDTO>>;
  unpinChannelPost(command: ChannelPostActionCommand): Promise<ChannelContentResult<ChannelPostDTO>>;
  listChannelFeed(query: ListChannelFeedQuery): Promise<ChannelContentResult<ChannelFeedView>>;
  getChannelPageView(query: ListChannelFeedQuery): Promise<ChannelContentResult<ChannelPageView>>;
}

type Deps = ChannelContentUseCaseDeps;

function fail<T>(code: "FORBIDDEN" | "NOT_FOUND" | "EMPTY_BODY" | "BODY_TOO_LONG" | "DEACTIVATED", message: string): ChannelContentResult<T> {
  return { ok: false, error: { code, message } };
}

async function leadPermissions(deps: Deps, channelId: string, userId: string): Promise<readonly ChannelLeadPermission[]> {
  const leads = await deps.channels.listChannelLeads(channelId);
  if (!leads.ok) return [];
  return leads.value.find((l) => l.userId === userId && l.status === "active")?.permissions ?? [];
}

async function channelSummary(deps: Deps, channelId: string): Promise<ChannelSummary | null> {
  const s = await deps.channels.getPublicSummary(channelId);
  return s ? {
    id: s.id,
    slug: s.slug,
    name: s.name,
    visibility: s.visibility,
    followerCount: s.followerCount,
    leadCount: s.leadCount,
  } : null;
}

async function viewerAccess(deps: Deps, channelId: string, viewerUserId: string) {
  const summary = await deps.channels.getPublicSummary(channelId);
  if (!summary) return null;
  const perms = await leadPermissions(deps, channelId, viewerUserId);
  const followed = (await deps.channels.listFollowedByUser(viewerUserId)).some((c) => c.id === channelId);
  const isManager = await deps.authority.canManageCommunity(summary.ownerId, viewerUserId);
  return {
    summary,
    perms,
    canView: canViewChannelFeed({
      visibility: summary.visibility,
      viewerFollows: followed,
      viewerIsLead: perms.length > 0,
      viewerIsCommunityManager: isManager,
    }),
  };
}

async function decorate(deps: Deps, channel: ChannelSummary, item: import("@server/domains-v2/content-v2/channel-posts/public-api").ChannelFeedItemDTO): Promise<ChannelFeedViewItem> {
  const profile = await deps.identity.getPublicProfile(null, item.authorUserId);
  return {
    ...item,
    channelSummary: channel,
    authorPublicSummary: profile.ok ? {
      userId: profile.value.userId,
      displayName: profile.value.displayName,
      handle: profile.value.profileSlug,
      avatarRef: profile.value.avatarMediaRef?.assetId ?? null,
    } : null,
  };
}

async function listChannelFeed(deps: Deps, query: ListChannelFeedQuery): Promise<ChannelContentResult<ChannelFeedView>> {
  const access = await viewerAccess(deps, query.channelId, query.viewerUserId);
  if (!access) return fail("NOT_FOUND", "Kanał nie istnieje.");
  if (!access.canView) return fail("FORBIDDEN", "Brak dostępu do feedu kanału.");
  const channel = await channelSummary(deps, query.channelId);
  if (!channel) return fail("NOT_FOUND", "Kanał nie istnieje.");
  const feed = await deps.posts.listFeed({ channelId: query.channelId, cursor: query.cursor, limit: query.limit });
  const [pinnedPost, items] = await Promise.all([
    feed.pinnedPost ? decorate(deps, channel, feed.pinnedPost) : Promise.resolve(null),
    Promise.all(feed.items.map((item) => decorate(deps, channel, item))),
  ]);
  return { ok: true, value: { pinnedPost, items, nextCursor: feed.nextCursor } };
}

export function createChannelContentUseCase(deps: Deps): ChannelContentUseCase {
  return {
    async createChannelPost(command) {
      const perms = await leadPermissions(deps, command.channelId, command.actorUserId);
      if (!canPublishChannelContent(perms)) return fail("FORBIDDEN", "Brak uprawnień do publikacji na kanale.");
      const res = await deps.posts.create({ channelId: command.channelId, authorUserId: command.actorUserId, body: command.body, mediaRefs: command.mediaRefs });
      return res.ok ? { ok: true, value: res.value.post } : res;
    },
    async updateChannelPost(command) {
      const post = await deps.posts.getById(command.postId);
      if (!post) return fail("NOT_FOUND", "Wpis kanału nie istnieje.");
      const perms = await leadPermissions(deps, post.channelId, command.actorUserId);
      const res = await deps.posts.update({ postId: command.postId, actorUserId: command.actorUserId, body: command.body, mediaRefs: command.mediaRefs, canManage: canManageChannelContent(perms) });
      return res.ok ? { ok: true, value: res.value.post } : res;
    },
    async deactivateChannelPost(command) {
      const post = await deps.posts.getById(command.postId);
      if (!post) return fail("NOT_FOUND", "Wpis kanału nie istnieje.");
      const perms = await leadPermissions(deps, post.channelId, command.actorUserId);
      const res = await deps.posts.deactivate({ postId: command.postId, actorUserId: command.actorUserId, canManage: canManageChannelContent(perms) });
      return res.ok ? { ok: true, value: { deactivated: true } } : res;
    },
    async pinChannelPost(command) {
      const post = await deps.posts.getById(command.postId);
      if (!post) return fail("NOT_FOUND", "Wpis kanału nie istnieje.");
      if (!canPinChannelPost(await leadPermissions(deps, post.channelId, command.actorUserId))) return fail("FORBIDDEN", "Brak uprawnień do przypięcia wpisu.");
      const res = await deps.posts.pin({ postId: command.postId, actorUserId: command.actorUserId });
      return res.ok ? { ok: true, value: res.value.post } : res;
    },
    async unpinChannelPost(command) {
      const post = await deps.posts.getById(command.postId);
      if (!post) return fail("NOT_FOUND", "Wpis kanału nie istnieje.");
      if (!canPinChannelPost(await leadPermissions(deps, post.channelId, command.actorUserId))) return fail("FORBIDDEN", "Brak uprawnień do odpięcia wpisu.");
      const res = await deps.posts.unpin({ postId: command.postId, actorUserId: command.actorUserId });
      return res.ok ? { ok: true, value: res.value.post } : res;
    },
    listChannelFeed: (query) => listChannelFeed(deps, query),
    async getChannelPageView(query) {
      const access = await viewerAccess(deps, query.channelId, query.viewerUserId);
      if (!access) return fail("NOT_FOUND", "Kanał nie istnieje.");
      const feed = access.canView ? await listChannelFeed(deps, query) : { ok: true as const, value: { pinnedPost: null, items: [], nextCursor: null } };
      if (!feed.ok) return feed;
      return { ok: true, value: {
        channel: {
          id: access.summary.id, slug: access.summary.slug, name: access.summary.name,
          visibility: access.summary.visibility, followerCount: access.summary.followerCount, leadCount: access.summary.leadCount,
        },
        viewer: {
          canViewFeed: access.canView,
          canPublish: canPublishChannelContent(access.perms),
          canManageContent: canManageChannelContent(access.perms),
          canPin: canPinChannelPost(access.perms),
        },
        feed: feed.value,
      } };
    },
  };
}
