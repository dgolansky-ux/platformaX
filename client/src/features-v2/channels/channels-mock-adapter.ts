/**
 * features-v2/channels / channels-mock-adapter — MOCK_LOCAL_ONLY transport for
 * the Channels product slice (Slice 7).
 *
 * No HTTP transport yet (TRANSPORT_PARTIAL). The adapter holds an in-memory
 * state seeded for the demo viewer ("u-viewer-demo"), and enforces the SAME
 * rules the backend orchestrator does:
 *   - follow is independent of community membership,
 *   - a channel must always have 1–5 active leads,
 *   - the last active lead cannot be revoked,
 *   - a channel lead must be a member of the channel's owner community.
 *
 * NO `@server/*` imports. Mutations actually mutate this store — there is no
 * fake save claim; the adapter is the local source of truth for the demo.
 */
import type {
  ChannelCardDTO,
  ChannelOwnerSummaryDTO,
  ChannelProfileDTO,
  ChannelsActionResult,
  ChannelsDirectoryDTO,
  ChannelStatus,
  ChannelVisibility,
  CreateChannelFrontendInput,
  FollowChannelFrontendInput,
} from "@shared/contracts/channels";
import type {
  AssignChannelLeadFrontendInput,
  ChannelLeadPermission,
  ChannelLeadPublicDTO,
  ChannelLeadRole,
  RevokeChannelLeadFrontendInput,
  UpdateChannelLeadPermissionsFrontendInput,
} from "@shared/contracts/channel-leads";
import { MAX_ACTIVE_LEADS, MIN_ACTIVE_LEADS } from "@shared/contracts/channel-leads";
import type {
  ChannelPostActionFrontendInput,
  ChannelPostDTO,
  CreateChannelPostFrontendInput,
} from "@shared/contracts/channel-posts";
import type {
  ChannelCommentDTO,
  ChannelCommentListDTO,
  ChannelCommentPolicyDTO,
  ChannelInteractionSettingsDTO,
  ChannelInteractionsActionResult,
  ChannelPostInteractionSummaryDTO,
  ChannelReactionSummaryDTO,
  ChannelReactionTargetType,
  CreateChannelCommentFrontendInput,
  DeactivateChannelCommentFrontendInput,
  ReactToChannelTargetFrontendInput,
  UpdateChannelCommentFrontendInput,
  UpdateChannelInteractionSettingsFrontendInput,
} from "@shared/contracts/channel-interactions";

const VIEWER_ID = "u-viewer-demo";
const VIEWER_NAME = "Demo użytkownik";
const FULL_LEAD_PERMISSIONS: ChannelLeadPermission[] = [
  "manage_channel_profile",
  "publish_channel_content",
  "manage_channel_content",
  "pin_channel_post",
  "moderate_channel_comments",
  "manage_channel_interactions",
  "manage_channel_leads",
  "view_channel_stats",
];

type CommunityRole = "founder" | "admin" | "moderator" | "member" | null;

type CommunityState = {
  id: string;
  slug: string;
  name: string;
  viewerRole: CommunityRole;
  /** Active members the demo can pick from when assigning leads. */
  members: ReadonlyArray<{ userId: string; displayName: string; role: Exclude<CommunityRole, null> }>;
};

type ChannelState = {
  id: string;
  slug: string;
  name: string;
  description: string;
  visibility: ChannelVisibility;
  status: ChannelStatus;
  ownerCommunityId: string;
};

type LeadState = {
  channelId: string;
  userId: string;
  displayName: string;
  role: ChannelLeadRole;
  permissions: ChannelLeadPermission[];
  active: boolean;
};

type FollowState = {
  channelId: string;
  userId: string;
};

type PostState = {
  id: string;
  channelId: string;
  authorUserId: string;
  body: string;
  mediaRefs: readonly string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  active: boolean;
};

type InteractionSettingsState = {
  channelId: string;
  commentsEnabled: boolean;
  reactionsEnabled: boolean;
  commentPolicy: ChannelCommentPolicyDTO;
  updatedAt: string;
};

type CommentState = {
  id: string;
  channelPostId: string;
  authorUserId: string;
  body: string;
  status: "active" | "edited" | "deactivated";
  moderationReason?: string;
  moderatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

type ReactionState = {
  id: string;
  targetType: ChannelReactionTargetType;
  targetId: string;
  userId: string;
  createdAt: string;
};

type State = {
  communities: Map<string, CommunityState>; // keyed by slug
  byCommunityId: Map<string, CommunityState>;
  channels: Map<string, ChannelState>; // keyed by slug
  byChannelId: Map<string, ChannelState>;
  leads: LeadState[];
  follows: FollowState[];
  posts: PostState[];
  interactionSettings: InteractionSettingsState[];
  comments: CommentState[];
  reactions: ReactionState[];
  failure: string | null;
  seq: number;
};

function seedCommunities(): CommunityState[] {
  return [
    {
      id: "community-product-builders",
      slug: "product-builders",
      name: "Product Builders",
      viewerRole: "founder",
      members: [
        { userId: VIEWER_ID, displayName: VIEWER_NAME, role: "founder" },
        { userId: "u-anna-pm", displayName: "Anna PM", role: "admin" },
        { userId: "u-marek-dev", displayName: "Marek Dev", role: "member" },
      ],
    },
    {
      id: "community-zdrowie-ruch",
      slug: "zdrowie-ruch",
      name: "Zdrowie i ruch",
      viewerRole: "member",
      members: [
        { userId: "u-zdr-founder", displayName: "Zofia Trener", role: "founder" },
        { userId: VIEWER_ID, displayName: VIEWER_NAME, role: "member" },
      ],
    },
    {
      id: "community-local-events",
      slug: "lokalne-wydarzenia",
      name: "Lokalne wydarzenia",
      viewerRole: null,
      members: [
        { userId: "u-jan-loc", displayName: "Jan Lokalny", role: "founder" },
      ],
    },
  ];
}

function seedChannels(): ChannelState[] {
  return [
    { id: "ch-pb-ogolny", slug: "pb-ogolny", name: "Ogólny", description: "Główny kanał Product Builders.", visibility: "public", status: "active", ownerCommunityId: "community-product-builders" },
    { id: "ch-pb-news", slug: "pb-newsletter", name: "Newsletter", description: "Cotygodniowe podsumowania.", visibility: "public", status: "active", ownerCommunityId: "community-product-builders" },
    { id: "ch-pb-research", slug: "pb-research", name: "Research", description: "Wnioski z badań i wywiadów.", visibility: "public", status: "active", ownerCommunityId: "community-product-builders" },
    { id: "ch-zdr-trening", slug: "zdrowie-trening", name: "Treningi", description: "Plany i prowadzenie sesji.", visibility: "public", status: "active", ownerCommunityId: "community-zdrowie-ruch" },
    { id: "ch-loc-spotkania", slug: "lokalne-spotkania", name: "Spotkania", description: "Najbliższe wydarzenia lokalne.", visibility: "public", status: "active", ownerCommunityId: "community-local-events" },
  ];
}

function seedLeads(): LeadState[] {
  return [
    { channelId: "ch-pb-ogolny", userId: VIEWER_ID, displayName: VIEWER_NAME, role: "lead", permissions: FULL_LEAD_PERMISSIONS, active: true },
    { channelId: "ch-pb-ogolny", userId: "u-anna-pm", displayName: "Anna PM", role: "co_lead", permissions: ["manage_channel_profile", "publish_channel_content"], active: true },
    { channelId: "ch-pb-news", userId: VIEWER_ID, displayName: VIEWER_NAME, role: "lead", permissions: FULL_LEAD_PERMISSIONS, active: true },
    { channelId: "ch-pb-research", userId: "u-anna-pm", displayName: "Anna PM", role: "lead", permissions: FULL_LEAD_PERMISSIONS, active: true },
    { channelId: "ch-zdr-trening", userId: "u-zdr-founder", displayName: "Zofia Trener", role: "lead", permissions: FULL_LEAD_PERMISSIONS, active: true },
    { channelId: "ch-loc-spotkania", userId: "u-jan-loc", displayName: "Jan Lokalny", role: "lead", permissions: FULL_LEAD_PERMISSIONS, active: true },
  ];
}

function seedPosts(): PostState[] {
  return [
    {
      id: "post-pb-ogolny-1",
      channelId: "ch-pb-ogolny",
      authorUserId: VIEWER_ID,
      body: "Startujemy z krótkimi aktualizacjami produktowymi. Pierwszy cykl: onboarding i jakość pierwszego tygodnia.",
      mediaRefs: [],
      pinned: true,
      createdAt: "2026-05-29T08:00:00Z",
      updatedAt: "2026-05-29T08:00:00Z",
      active: true,
    },
    {
      id: "post-pb-ogolny-2",
      channelId: "ch-pb-ogolny",
      authorUserId: "u-anna-pm",
      body: "Dziś zbieramy pytania do sesji Q&A. Dopiszcie tematy, które mają największy wpływ na aktywację.",
      mediaRefs: [],
      pinned: false,
      createdAt: "2026-05-29T07:00:00Z",
      updatedAt: "2026-05-29T07:00:00Z",
      active: true,
    },
    {
      id: "post-zdr-trening-1",
      channelId: "ch-zdr-trening",
      authorUserId: "u-zdr-founder",
      body: "Nowy plan treningowy dla osób wracających po przerwie: trzy krótkie sesje zamiast jednej długiej.",
      mediaRefs: [],
      pinned: false,
      createdAt: "2026-05-28T17:00:00Z",
      updatedAt: "2026-05-28T17:00:00Z",
      active: true,
    },
  ];
}

function makeInitialState(): State {
  const communities = seedCommunities();
  const communitiesBySlug = new Map<string, CommunityState>();
  const communitiesById = new Map<string, CommunityState>();
  for (const c of communities) {
    communitiesBySlug.set(c.slug, c);
    communitiesById.set(c.id, c);
  }

  const channels = seedChannels();
  const channelsBySlug = new Map<string, ChannelState>();
  const channelsById = new Map<string, ChannelState>();
  for (const c of channels) {
    channelsBySlug.set(c.slug, c);
    channelsById.set(c.id, c);
  }

  const leads = seedLeads();

  const follows: FollowState[] = [
    // Viewer follows research + Zofia's training channel out of the box.
    { channelId: "ch-pb-research", userId: VIEWER_ID },
    { channelId: "ch-zdr-trening", userId: VIEWER_ID },
  ];
  const posts = seedPosts();
  const interactionSettings = channels.map((channel) => ({
    channelId: channel.id,
    commentsEnabled: true,
    reactionsEnabled: true,
    commentPolicy: "followers" as const,
    updatedAt: "2026-05-29T08:00:00Z",
  }));
  const comments: CommentState[] = [
    {
      id: "comment-pb-1",
      channelPostId: "post-pb-ogolny-1",
      authorUserId: "u-marek-dev",
      body: "Super, przyda się krótki plan tematów na kolejny tydzień.",
      status: "active",
      createdAt: "2026-05-29T09:00:00Z",
      updatedAt: "2026-05-29T09:00:00Z",
    },
  ];
  const reactions: ReactionState[] = [
    { id: "reaction-pb-1", targetType: "channel_post", targetId: "post-pb-ogolny-1", userId: VIEWER_ID, createdAt: "2026-05-29T09:05:00Z" },
    { id: "reaction-pb-2", targetType: "channel_comment", targetId: "comment-pb-1", userId: VIEWER_ID, createdAt: "2026-05-29T09:06:00Z" },
  ];

  return {
    communities: communitiesBySlug,
    byCommunityId: communitiesById,
    channels: channelsBySlug,
    byChannelId: channelsById,
    leads,
    follows,
    posts,
    interactionSettings,
    comments,
    reactions,
    failure: null,
    seq: 100,
  };
}

let state: State = makeInitialState();

function nextId(prefix: string): string {
  state.seq += 1;
  return `${prefix}-${state.seq}`;
}

function fail<T>(message: string): ChannelsActionResult<T> {
  return { ok: false, error: { code: "UNKNOWN", message } };
}

function failureCheck<T>(): ChannelsActionResult<T> | null {
  return state.failure ? fail<T>(state.failure) : null;
}

function activeLeadCount(channelId: string): number {
  return state.leads.filter((l) => l.channelId === channelId && l.active).length;
}

function followerCount(channelId: string): number {
  return state.follows.filter((f) => f.channelId === channelId).length;
}

function viewerLeadFor(channelId: string): LeadState | null {
  return state.leads.find((l) => l.channelId === channelId && l.userId === VIEWER_ID && l.active) ?? null;
}

function viewerFollows(channelId: string): boolean {
  return state.follows.some((f) => f.channelId === channelId && f.userId === VIEWER_ID);
}

function ownerSummary(communityId: string): ChannelOwnerSummaryDTO | null {
  const c = state.byCommunityId.get(communityId);
  return c ? { communityId: c.id, communitySlug: c.slug, communityName: c.name } : null;
}

function toCard(channel: ChannelState): ChannelCardDTO {
  const owner = ownerSummary(channel.ownerCommunityId);
  const viewerLead = viewerLeadFor(channel.id);
  if (!owner) {
    throw new Error(`Channel ${channel.id} references unknown community ${channel.ownerCommunityId}.`);
  }
  return {
    id: channel.id,
    slug: channel.slug,
    name: channel.name,
    description: channel.description,
    visibility: channel.visibility,
    status: channel.status,
    followerCount: followerCount(channel.id),
    leadCount: activeLeadCount(channel.id),
    owner,
    viewerFollows: viewerFollows(channel.id),
    viewerIsLead: viewerLead !== null,
    viewerLeadRole: viewerLead?.role ?? null,
    lastPostPreview: latestPostPreview(channel.id),
    postCount: postCount(channel.id),
  };
}

function postCount(channelId: string): number {
  return state.posts.filter((p) => p.channelId === channelId && p.active).length;
}

function latestPostPreview(channelId: string): string | undefined {
  const latest = orderedPosts(channelId).find((p) => !p.pinned) ?? orderedPosts(channelId)[0];
  return latest ? latest.body.slice(0, 96) : undefined;
}

function leadPermissions(channelId: string): ChannelLeadPermission[] {
  return viewerLeadFor(channelId)?.permissions ?? [];
}

function hasPermission(channelId: string, permission: ChannelLeadPermission): boolean {
  return leadPermissions(channelId).includes(permission);
}

function interactionSettings(channelId: string): InteractionSettingsState {
  let settings = state.interactionSettings.find((s) => s.channelId === channelId);
  if (!settings) {
    settings = {
      channelId,
      commentsEnabled: true,
      reactionsEnabled: true,
      commentPolicy: "followers",
      updatedAt: new Date().toISOString(),
    };
    state.interactionSettings.push(settings);
  }
  return settings;
}

function canComment(channel: ChannelState): boolean {
  const settings = interactionSettings(channel.id);
  if (!settings.commentsEnabled) return false;
  if (viewerLeadFor(channel.id)) return true;
  if (settings.commentPolicy === "followers") return viewerFollows(channel.id);
  if (settings.commentPolicy === "community_members") {
    return state.byCommunityId.get(channel.ownerCommunityId)?.viewerRole !== null;
  }
  return false;
}

function interactionPermissionMessage(channel: ChannelState): string | null {
  const settings = interactionSettings(channel.id);
  if (!settings.commentsEnabled) return "Komentarze są wyłączone przez prowadzących.";
  if (canComment(channel)) return null;
  if (settings.commentPolicy === "followers") return "Komentować mogą obserwujący kanał.";
  if (settings.commentPolicy === "community_members") return "Komentować mogą członkowie społeczności właściciela.";
  return "Komentować mogą tylko prowadzący kanał.";
}

function reactionSummary(targetType: ChannelReactionTargetType, targetId: string): ChannelReactionSummaryDTO {
  const total = state.reactions.filter((r) => r.targetType === targetType && r.targetId === targetId).length;
  return { targetType, targetId, counts: { like: total }, total };
}

function viewerLiked(targetType: ChannelReactionTargetType, targetId: string): boolean {
  return state.reactions.some((r) => r.targetType === targetType && r.targetId === targetId && r.userId === VIEWER_ID);
}

function orderedPosts(channelId: string): PostState[] {
  return state.posts
    .filter((p) => p.channelId === channelId && p.active)
    .sort((a, b) => (
      a.pinned !== b.pinned ? (a.pinned ? -1 : 1)
        : a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0
    ));
}

function postToDto(post: PostState): ChannelPostDTO {
  const lead = state.leads.find((l) => l.userId === post.authorUserId);
  const channel = state.byChannelId.get(post.channelId);
  const settings = interactionSettings(post.channelId);
  const reactionCount = reactionSummary("channel_post", post.id).total;
  const commentCount = state.comments.filter((c) => c.channelPostId === post.id && c.status !== "deactivated").length;
  return {
    id: post.id,
    channelId: post.channelId,
    author: {
      userId: post.authorUserId,
      displayName: lead?.displayName ?? post.authorUserId,
      handle: post.authorUserId,
      avatarRef: null,
    },
    body: post.body,
    mediaRefs: post.mediaRefs,
    pinned: post.pinned,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    viewerCanPin: hasPermission(post.channelId, "pin_channel_post"),
    viewerCanManage: hasPermission(post.channelId, "manage_channel_content") || post.authorUserId === VIEWER_ID,
    interactions: {
      commentCount,
      reactionCount,
      viewerLiked: viewerLiked("channel_post", post.id),
      commentsEnabled: settings.commentsEnabled,
      reactionsEnabled: settings.reactionsEnabled,
      canComment: channel ? canComment(channel) : false,
      canReact: settings.reactionsEnabled,
      canModerateComments: hasPermission(post.channelId, "moderate_channel_comments"),
      permissionMessage: channel ? interactionPermissionMessage(channel) : null,
    },
  };
}

function viewerActiveCommunityIds(): string[] {
  const out: string[] = [];
  for (const c of state.communities.values()) {
    if (c.viewerRole !== null) out.push(c.id);
  }
  return out;
}

async function getDirectoryView(): Promise<ChannelsActionResult<ChannelsDirectoryDTO>> {
  const f = failureCheck<ChannelsDirectoryDTO>(); if (f) return f;
  const myCommunityIds = new Set(viewerActiveCommunityIds());

  const all = [...state.byChannelId.values()].filter((c) => c.status === "active");
  const followed = all.filter((c) => viewerFollows(c.id)).map(toCard);
  const leading = all.filter((c) => viewerLeadFor(c.id) !== null).map(toCard);
  const myCommunityChannels = all
    .filter((c) => myCommunityIds.has(c.ownerCommunityId))
    .map(toCard);
  const known = new Set<string>([
    ...followed.map((c) => c.id),
    ...leading.map((c) => c.id),
    ...myCommunityChannels.map((c) => c.id),
  ]);
  const discover = all.filter((c) => !known.has(c.id) && c.visibility === "public").map(toCard);

  return { ok: true, value: { followed, myCommunityChannels, leading, discover } };
}

async function getChannelProfile(slug: string): Promise<ChannelsActionResult<ChannelProfileDTO>> {
  const f = failureCheck<ChannelProfileDTO>(); if (f) return f;
  const channel = state.channels.get(slug);
  if (!channel) return { ok: false, error: { code: "NOT_FOUND", message: "Kanał nie istnieje." } };
  const card = toCard(channel);
  const leads: ChannelLeadPublicDTO[] = state.leads
    .filter((l) => l.channelId === channel.id && l.active)
    .map((l) => ({ userId: l.userId, displayName: l.displayName, role: l.role, permissions: [...l.permissions] }));
  const viewerLead = viewerLeadFor(channel.id);
  const community = state.byCommunityId.get(channel.ownerCommunityId);
  const isManager = community?.viewerRole === "founder" || community?.viewerRole === "admin";
  const canManageChannel = isManager || (viewerLead?.permissions.includes("manage_channel_profile") ?? false);
  const canManageLeads = isManager || (viewerLead?.permissions.includes("manage_channel_leads") ?? false);
  const canViewFeed = channel.visibility === "public" || card.viewerFollows || viewerLead !== null || isManager;
  const posts = canViewFeed ? orderedPosts(channel.id).map(postToDto) : [];
  const pinnedPost = posts.find((p) => p.pinned) ?? null;

  return {
    ok: true,
    value: {
      channel: card,
      leads,
      feed: {
        pinnedPost,
        items: posts,
        nextCursor: null,
        canViewFeed,
        canPublish: viewerLead?.permissions.includes("publish_channel_content") ?? false,
        canManageContent: viewerLead?.permissions.includes("manage_channel_content") ?? false,
        canPin: viewerLead?.permissions.includes("pin_channel_post") ?? false,
        interactionSettings: {
          ...interactionSettings(channel.id),
          moderationPolicy: "lead_permission_required",
          viewerCanUpdate: viewerLead?.permissions.includes("manage_channel_interactions") ?? false,
        },
      },
      viewer: {
        follows: card.viewerFollows,
        isLead: viewerLead !== null,
        leadRole: viewerLead?.role ?? null,
        canManageChannel,
        canManageLeads,
        canFollow: channel.visibility === "public",
      },
    },
  };
}

function commentToDto(comment: CommentState): ChannelCommentDTO {
  const lead = state.leads.find((l) => l.userId === comment.authorUserId);
  const author = lead ? { userId: lead.userId, displayName: lead.displayName, handle: lead.userId, avatarRef: null } : { userId: comment.authorUserId, displayName: comment.authorUserId, handle: comment.authorUserId, avatarRef: null };
  const post = state.posts.find((p) => p.id === comment.channelPostId);
  const canModerate = post ? hasPermission(post.channelId, "moderate_channel_comments") : false;
  return {
    id: comment.id,
    channelPostId: comment.channelPostId,
    author,
    body: comment.status === "deactivated" ? "" : comment.body,
    status: comment.status,
    moderationReason: comment.moderationReason,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    viewerCanEdit: comment.authorUserId === VIEWER_ID && comment.status !== "deactivated",
    viewerCanDeactivate: (comment.authorUserId === VIEWER_ID || canModerate) && comment.status !== "deactivated",
    viewerCanModerate: canModerate && comment.status !== "deactivated",
  };
}

async function listChannelComments(channelSlug: string, postId: string): Promise<ChannelInteractionsActionResult<ChannelCommentListDTO>> {
  const f = failureCheck<ChannelCommentListDTO>(); if (f) return f;
  const channel = state.channels.get(channelSlug);
  if (!channel) return { ok: false, error: { code: "NOT_FOUND", message: "Kanał nie istnieje." } };
  const post = state.posts.find((p) => p.id === postId && p.channelId === channel.id && p.active);
  if (!post) return { ok: false, error: { code: "NOT_FOUND", message: "Wpis nie istnieje." } };
  const items = state.comments.filter((c) => c.channelPostId === postId).sort((a, b) => a.createdAt < b.createdAt ? -1 : 1).map(commentToDto);
  return {
    ok: true,
    value: {
      items,
      nextCursor: null,
      reactions: items.map((comment) => ({
        commentId: comment.id,
        reactions: reactionSummary("channel_comment", comment.id),
        viewer: { targetType: "channel_comment", targetId: comment.id, active: viewerLiked("channel_comment", comment.id) ? ["like"] : [] },
      })),
      canComment: canComment(channel),
      canReact: interactionSettings(channel.id).reactionsEnabled,
      permissionMessage: interactionPermissionMessage(channel),
    },
  };
}

async function createChannelComment(input: CreateChannelCommentFrontendInput): Promise<ChannelInteractionsActionResult<ChannelCommentDTO>> {
  const f = failureCheck<ChannelCommentDTO>(); if (f) return f;
  const channel = state.channels.get(input.channelSlug);
  if (!channel) return { ok: false, error: { code: "NOT_FOUND", message: "Kanał nie istnieje." } };
  if (!canComment(channel)) return { ok: false, error: { code: "FORBIDDEN", message: interactionPermissionMessage(channel) ?? "Brak uprawnień." } };
  const post = state.posts.find((p) => p.id === input.postId && p.channelId === channel.id && p.active);
  if (!post) return { ok: false, error: { code: "NOT_FOUND", message: "Wpis nie istnieje." } };
  const body = input.body.trim();
  if (!body) return { ok: false, error: { code: "VALIDATION", field: "body", message: "Komentarz nie może być pusty." } };
  const now = new Date().toISOString();
  const comment: CommentState = {
    id: nextId("comment"),
    channelPostId: post.id,
    authorUserId: VIEWER_ID,
    body,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  state.comments.push(comment);
  return { ok: true, value: commentToDto(comment) };
}

async function updateChannelComment(input: UpdateChannelCommentFrontendInput): Promise<ChannelInteractionsActionResult<ChannelCommentDTO>> {
  const f = failureCheck<ChannelCommentDTO>(); if (f) return f;
  const comment = state.comments.find((c) => c.id === input.commentId && c.channelPostId === input.postId);
  if (!comment) return { ok: false, error: { code: "NOT_FOUND", message: "Komentarz nie istnieje." } };
  if (comment.authorUserId !== VIEWER_ID) return { ok: false, error: { code: "FORBIDDEN", message: "Możesz edytować tylko własny komentarz." } };
  comment.body = input.body.trim();
  comment.status = "edited";
  comment.updatedAt = new Date().toISOString();
  return { ok: true, value: commentToDto(comment) };
}

async function deactivateChannelComment(input: DeactivateChannelCommentFrontendInput): Promise<ChannelInteractionsActionResult<ChannelCommentDTO>> {
  const f = failureCheck<ChannelCommentDTO>(); if (f) return f;
  const channel = state.channels.get(input.channelSlug);
  const comment = state.comments.find((c) => c.id === input.commentId && c.channelPostId === input.postId);
  if (!channel || !comment) return { ok: false, error: { code: "NOT_FOUND", message: "Komentarz nie istnieje." } };
  const canModerate = hasPermission(channel.id, "moderate_channel_comments");
  if (comment.authorUserId !== VIEWER_ID && !canModerate) return { ok: false, error: { code: "FORBIDDEN", message: "Brak uprawnień do moderacji komentarza." } };
  comment.body = "";
  comment.status = "deactivated";
  comment.moderationReason = canModerate && comment.authorUserId !== VIEWER_ID ? input.moderationReason ?? "moderated" : undefined;
  comment.moderatedByUserId = canModerate && comment.authorUserId !== VIEWER_ID ? VIEWER_ID : undefined;
  comment.updatedAt = new Date().toISOString();
  return { ok: true, value: commentToDto(comment) };
}

async function reactToChannelTarget(input: ReactToChannelTargetFrontendInput): Promise<ChannelInteractionsActionResult<ChannelPostInteractionSummaryDTO | ChannelReactionSummaryDTO>> {
  const f = failureCheck<ChannelPostInteractionSummaryDTO | ChannelReactionSummaryDTO>(); if (f) return f;
  const channel = state.channels.get(input.channelSlug);
  if (!channel) return { ok: false, error: { code: "NOT_FOUND", message: "Kanał nie istnieje." } };
  if (!interactionSettings(channel.id).reactionsEnabled) return { ok: false, error: { code: "FORBIDDEN", message: "Reakcje są wyłączone." } };
  const existing = state.reactions.findIndex((r) => r.targetType === input.targetType && r.targetId === input.targetId && r.userId === VIEWER_ID);
  if (input.mode === "remove" || (input.mode === "toggle" && existing !== -1)) {
    if (existing !== -1) state.reactions.splice(existing, 1);
  } else if (existing === -1) {
    state.reactions.push({ id: nextId("reaction"), targetType: input.targetType, targetId: input.targetId, userId: VIEWER_ID, createdAt: new Date().toISOString() });
  }
  if (input.targetType === "channel_post") {
    return { ok: true, value: postInteractionSummary(input.targetId) };
  }
  return { ok: true, value: reactionSummary(input.targetType, input.targetId) };
}

function postInteractionSummary(postId: string): ChannelPostInteractionSummaryDTO {
  return {
    channelPostId: postId,
    commentCount: state.comments.filter((c) => c.channelPostId === postId && c.status !== "deactivated").length,
    reactions: reactionSummary("channel_post", postId),
    viewer: { targetType: "channel_post", targetId: postId, active: viewerLiked("channel_post", postId) ? ["like"] : [] },
  };
}

async function updateInteractionSettings(input: UpdateChannelInteractionSettingsFrontendInput): Promise<ChannelInteractionsActionResult<ChannelInteractionSettingsDTO>> {
  const f = failureCheck<ChannelInteractionSettingsDTO>(); if (f) return f;
  const channel = state.channels.get(input.channelSlug);
  if (!channel) return { ok: false, error: { code: "NOT_FOUND", message: "Kanał nie istnieje." } };
  if (!hasPermission(channel.id, "manage_channel_interactions")) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Brak uprawnień do ustawień interakcji." } };
  }
  const settings = interactionSettings(channel.id);
  settings.commentsEnabled = input.commentsEnabled;
  settings.reactionsEnabled = input.reactionsEnabled;
  settings.commentPolicy = input.commentPolicy;
  settings.updatedAt = new Date().toISOString();
  return { ok: true, value: { ...settings, moderationPolicy: "lead_permission_required", viewerCanUpdate: true } };
}

async function createChannelPost(input: CreateChannelPostFrontendInput): Promise<ChannelsActionResult<ChannelPostDTO>> {
  const f = failureCheck<ChannelPostDTO>(); if (f) return f;
  const channel = state.channels.get(input.channelSlug);
  if (!channel) return { ok: false, error: { code: "NOT_FOUND", message: "Kanał nie istnieje." } };
  if (!hasPermission(channel.id, "publish_channel_content")) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Brak uprawnień do publikacji na kanale." } };
  }
  const body = input.body.trim();
  if (body.length === 0) {
    return { ok: false, error: { code: "VALIDATION", field: "body", message: "Wpis nie może być pusty." } };
  }
  const now = new Date().toISOString();
  const post: PostState = {
    id: nextId("post"),
    channelId: channel.id,
    authorUserId: VIEWER_ID,
    body,
    mediaRefs: input.mediaRefs ?? [],
    pinned: false,
    createdAt: now,
    updatedAt: now,
    active: true,
  };
  state.posts.push(post);
  return { ok: true, value: postToDto(post) };
}

async function setPostPinned(input: ChannelPostActionFrontendInput, pinned: boolean): Promise<ChannelsActionResult<ChannelPostDTO>> {
  const f = failureCheck<ChannelPostDTO>(); if (f) return f;
  const channel = state.channels.get(input.channelSlug);
  if (!channel) return { ok: false, error: { code: "NOT_FOUND", message: "Kanał nie istnieje." } };
  if (!hasPermission(channel.id, "pin_channel_post")) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Brak uprawnień do przypinania wpisów." } };
  }
  const post = state.posts.find((p) => p.id === input.postId && p.channelId === channel.id && p.active);
  if (!post) return { ok: false, error: { code: "NOT_FOUND", message: "Wpis nie istnieje." } };
  if (pinned) {
    for (const p of state.posts) if (p.channelId === channel.id) p.pinned = false;
  }
  post.pinned = pinned;
  post.updatedAt = new Date().toISOString();
  return { ok: true, value: postToDto(post) };
}

async function createChannel(input: CreateChannelFrontendInput): Promise<ChannelsActionResult<ChannelCardDTO>> {
  const f = failureCheck<ChannelCardDTO>(); if (f) return f;
  const community = state.communities.get(input.communitySlug);
  if (!community) return { ok: false, error: { code: "NOT_FOUND", message: "Społeczność nie istnieje." } };
  if (community.viewerRole !== "founder" && community.viewerRole !== "admin") {
    return { ok: false, error: { code: "FORBIDDEN", message: "Tylko founder/admin społeczności może utworzyć kanał." } };
  }
  const slug = input.slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { ok: false, error: { code: "VALIDATION", field: "slug", message: "Slug może zawierać tylko małe litery, cyfry i pojedyncze myślniki." } };
  }
  if (state.channels.has(slug)) {
    return { ok: false, error: { code: "CONFLICT", message: "Kanał o tym slug już istnieje." } };
  }
  const initialLeadUserId = input.initialLeadUserId ?? VIEWER_ID;
  const lead = community.members.find((m) => m.userId === initialLeadUserId);
  if (!lead) {
    return { ok: false, error: { code: "VALIDATION", field: "initialLeadUserId", message: "Prowadzący musi być członkiem społeczności." } };
  }

  const channel: ChannelState = {
    id: nextId("ch"),
    slug,
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    visibility: input.visibility ?? "public",
    status: "active",
    ownerCommunityId: community.id,
  };
  state.channels.set(slug, channel);
  state.byChannelId.set(channel.id, channel);
  state.leads.push({
    channelId: channel.id,
    userId: lead.userId,
    displayName: lead.displayName,
    role: "lead",
    permissions: FULL_LEAD_PERMISSIONS,
    active: true,
  });
  return { ok: true, value: toCard(channel) };
}

function findChannelBySlugOr<T>(slug: string): ChannelState | ChannelsActionResult<T> {
  const channel = state.channels.get(slug);
  if (!channel) return { ok: false, error: { code: "NOT_FOUND", message: "Kanał nie istnieje." } };
  return channel;
}

function viewerMayManageLeads(channel: ChannelState): boolean {
  const community = state.byCommunityId.get(channel.ownerCommunityId);
  if (community?.viewerRole === "founder" || community?.viewerRole === "admin") return true;
  const viewerLead = viewerLeadFor(channel.id);
  return viewerLead?.permissions.includes("manage_channel_leads") ?? false;
}

async function assignLead(input: AssignChannelLeadFrontendInput): Promise<ChannelsActionResult<ChannelLeadPublicDTO>> {
  const f = failureCheck<ChannelLeadPublicDTO>(); if (f) return f;
  const res = findChannelBySlugOr<ChannelLeadPublicDTO>(input.channelSlug);
  if ("ok" in res) return res;
  const channel = res;
  if (!viewerMayManageLeads(channel)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Brak uprawnień do zarządzania prowadzącymi tego kanału." } };
  }
  const community = state.byCommunityId.get(channel.ownerCommunityId);
  if (!community) return { ok: false, error: { code: "NOT_FOUND", message: "Brak społeczności-właściciela." } };
  const member = community.members.find((m) => m.userId === input.targetUserId);
  if (!member) {
    return { ok: false, error: { code: "VALIDATION", field: "targetUserId", message: "Prowadzący musi być członkiem społeczności." } };
  }
  const existing = state.leads.find((l) => l.channelId === channel.id && l.userId === input.targetUserId && l.active);
  if (existing) {
    return { ok: true, value: { userId: existing.userId, displayName: existing.displayName, role: existing.role, permissions: [...existing.permissions] } };
  }
  if (activeLeadCount(channel.id) >= MAX_ACTIVE_LEADS) {
    return { ok: false, error: { code: "CONFLICT", message: `Kanał ma już maksymalnie ${MAX_ACTIVE_LEADS} prowadzących.` } };
  }
  const permissions = input.permissions ? [...input.permissions] : (["manage_channel_profile"] as ChannelLeadPermission[]);
  state.leads.push({
    channelId: channel.id,
    userId: member.userId,
    displayName: member.displayName,
    role: input.role,
    permissions,
    active: true,
  });
  return { ok: true, value: { userId: member.userId, displayName: member.displayName, role: input.role, permissions } };
}

async function revokeLead(input: RevokeChannelLeadFrontendInput): Promise<ChannelsActionResult<{ revoked: boolean }>> {
  const f = failureCheck<{ revoked: boolean }>(); if (f) return f;
  const res = findChannelBySlugOr<{ revoked: boolean }>(input.channelSlug);
  if ("ok" in res) return res;
  const channel = res;
  if (!viewerMayManageLeads(channel)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Brak uprawnień do zarządzania prowadzącymi." } };
  }
  const lead = state.leads.find((l) => l.channelId === channel.id && l.userId === input.targetUserId && l.active);
  if (!lead) return { ok: false, error: { code: "NOT_FOUND", message: "Wskazana osoba nie jest aktywnym prowadzącym." } };
  if (activeLeadCount(channel.id) <= MIN_ACTIVE_LEADS) {
    return { ok: false, error: { code: "CONFLICT", message: `Kanał musi mieć co najmniej ${MIN_ACTIVE_LEADS} prowadzącego.` } };
  }
  lead.active = false;
  return { ok: true, value: { revoked: true } };
}

async function updateLeadPermissions(input: UpdateChannelLeadPermissionsFrontendInput): Promise<ChannelsActionResult<ChannelLeadPublicDTO>> {
  const f = failureCheck<ChannelLeadPublicDTO>(); if (f) return f;
  const res = findChannelBySlugOr<ChannelLeadPublicDTO>(input.channelSlug);
  if ("ok" in res) return res;
  const channel = res;
  if (!viewerMayManageLeads(channel)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Brak uprawnień do zmiany uprawnień." } };
  }
  const lead = state.leads.find((l) => l.channelId === channel.id && l.userId === input.targetUserId && l.active);
  if (!lead) return { ok: false, error: { code: "NOT_FOUND", message: "Wskazana osoba nie jest aktywnym prowadzącym." } };
  lead.permissions = [...new Set(input.permissions)] as ChannelLeadPermission[];
  return { ok: true, value: { userId: lead.userId, displayName: lead.displayName, role: lead.role, permissions: [...lead.permissions] } };
}

async function setFollow(input: FollowChannelFrontendInput, active: boolean): Promise<ChannelsActionResult<ChannelCardDTO>> {
  const f = failureCheck<ChannelCardDTO>(); if (f) return f;
  const channel = state.channels.get(input.channelSlug);
  if (!channel) return { ok: false, error: { code: "NOT_FOUND", message: "Kanał nie istnieje." } };
  const idx = state.follows.findIndex((x) => x.channelId === channel.id && x.userId === VIEWER_ID);
  if (active) {
    if (idx === -1) state.follows.push({ channelId: channel.id, userId: VIEWER_ID });
  } else if (idx !== -1) {
    state.follows.splice(idx, 1);
  }
  return { ok: true, value: toCard(channel) };
}

function communityMembersFor(slug: string): ChannelsActionResult<ReadonlyArray<{ userId: string; displayName: string }>> {
  const community = state.communities.get(slug);
  if (!community) return { ok: false, error: { code: "NOT_FOUND", message: "Społeczność nie istnieje." } };
  return { ok: true, value: community.members.map((m) => ({ userId: m.userId, displayName: m.displayName })) };
}

export type ChannelsMockAdapter = {
  getDirectoryView(): Promise<ChannelsActionResult<ChannelsDirectoryDTO>>;
  getChannelProfile(slug: string): Promise<ChannelsActionResult<ChannelProfileDTO>>;
  createChannel(input: CreateChannelFrontendInput): Promise<ChannelsActionResult<ChannelCardDTO>>;
  assignLead(input: AssignChannelLeadFrontendInput): Promise<ChannelsActionResult<ChannelLeadPublicDTO>>;
  revokeLead(input: RevokeChannelLeadFrontendInput): Promise<ChannelsActionResult<{ revoked: boolean }>>;
  updateLeadPermissions(input: UpdateChannelLeadPermissionsFrontendInput): Promise<ChannelsActionResult<ChannelLeadPublicDTO>>;
  createChannelPost(input: CreateChannelPostFrontendInput): Promise<ChannelsActionResult<ChannelPostDTO>>;
  pinChannelPost(input: ChannelPostActionFrontendInput): Promise<ChannelsActionResult<ChannelPostDTO>>;
  unpinChannelPost(input: ChannelPostActionFrontendInput): Promise<ChannelsActionResult<ChannelPostDTO>>;
  followChannel(input: FollowChannelFrontendInput): Promise<ChannelsActionResult<ChannelCardDTO>>;
  unfollowChannel(input: FollowChannelFrontendInput): Promise<ChannelsActionResult<ChannelCardDTO>>;
  communityMembers(communitySlug: string): Promise<ChannelsActionResult<ReadonlyArray<{ userId: string; displayName: string }>>>;
  listChannelComments(channelSlug: string, postId: string): Promise<ChannelInteractionsActionResult<ChannelCommentListDTO>>;
  createChannelComment(input: CreateChannelCommentFrontendInput): Promise<ChannelInteractionsActionResult<ChannelCommentDTO>>;
  updateChannelComment(input: UpdateChannelCommentFrontendInput): Promise<ChannelInteractionsActionResult<ChannelCommentDTO>>;
  deactivateChannelComment(input: DeactivateChannelCommentFrontendInput): Promise<ChannelInteractionsActionResult<ChannelCommentDTO>>;
  reactToChannelTarget(input: ReactToChannelTargetFrontendInput): Promise<ChannelInteractionsActionResult<ChannelPostInteractionSummaryDTO | ChannelReactionSummaryDTO>>;
  updateInteractionSettings(input: UpdateChannelInteractionSettingsFrontendInput): Promise<ChannelInteractionsActionResult<ChannelInteractionSettingsDTO>>;
  __setFailureForTests(message: string | null): void;
  __resetForTests(): void;
};

export const channelsMockAdapter: ChannelsMockAdapter = {
  getDirectoryView,
  getChannelProfile,
  createChannel,
  assignLead,
  revokeLead,
  updateLeadPermissions,
  createChannelPost,
  pinChannelPost: (input) => setPostPinned(input, true),
  unpinChannelPost: (input) => setPostPinned(input, false),
  followChannel: (input) => setFollow(input, true),
  unfollowChannel: (input) => setFollow(input, false),
  communityMembers: async (slug) => communityMembersFor(slug),
  listChannelComments,
  createChannelComment,
  updateChannelComment,
  deactivateChannelComment,
  reactToChannelTarget,
  updateInteractionSettings,
  __setFailureForTests(message) { state.failure = message; },
  __resetForTests() { state = makeInitialState(); },
};
