/**
 * features-v2/communities-v2 / mock-adapter — MOCK_LOCAL_ONLY transport.
 *
 * There is no HTTP transport yet (TRANSPORT_PARTIAL): the adapter holds a
 * realistic in-memory state seeded from shared/fixtures, exposes the full
 * Communities MVP product flow, and persists across the SPA lifetime so the
 * UI is genuinely usable. NO `@server/*` imports here. NO fake save claims —
 * the adapter is the source of truth for the local fixture only.
 */
import {
  toCommunityId,
  type ChangeCommunityMemberRoleInput,
  type CommunitiesShellData,
  type CommunityActionResult,
  type CommunityCardDTO,
  type CommunityCategoryDTO,
  type CommunityChannelSummaryDTO,
  type CommunityHubViewDTO,
  type CommunityJoinRequestSummaryDTO,
  type CommunityMemberSummaryDTO,
  type CommunityModuleSummaryDTO,
  type CommunityProfileDTO,
  type CreateCommunityChannelInput,
  type CreateCommunityInput,
  type DecideJoinRequestInput,
  type ToggleCommunityModuleInput,
  type UpdateCommunitySettingsInput,
} from "@shared/contracts/communities";
import {
  COMMUNITY_MODULE_CATALOG,
  COMMUNITY_SEED_FIXTURES,
  FIXTURE_VIEWER_USER_ID,
  buildHubViewFromSeed,
  type CommunityFixtureSeed,
} from "@shared/fixtures/communities";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const CATEGORY_CATALOG: readonly CommunityCategoryDTO[] = [
  { slug: "biznes",          name: "Biznes",            emoji: "💼", sortOrder: 1 },
  { slug: "technologia",     name: "Technologia",       emoji: "💻", sortOrder: 2 },
  { slug: "sport",           name: "Sport i ruch",      emoji: "🏃", sortOrder: 3 },
  { slug: "zdrowie",         name: "Zdrowie",           emoji: "🩺", sortOrder: 4 },
  { slug: "edukacja",        name: "Edukacja",          emoji: "🎓", sortOrder: 5 },
  { slug: "kultura",         name: "Kultura i sztuka",  emoji: "🎭", sortOrder: 6 },
  { slug: "lokalne",         name: "Lokalne",           emoji: "📍", sortOrder: 7 },
  { slug: "rodzina",         name: "Rodzina",           emoji: "👨‍👩‍👧", sortOrder: 8 },
  { slug: "hobby",           name: "Hobby",             emoji: "🎨", sortOrder: 9 },
  { slug: "podroze",         name: "Podróże",           emoji: "🌍", sortOrder: 10 },
  { slug: "spolecznosci",    name: "Społeczności",      emoji: "🤝", sortOrder: 11 },
  { slug: "rozwoj-osobisty", name: "Rozwój osobisty",   emoji: "🌱", sortOrder: 12 },
];

type CommunityState = {
  profile: CommunityProfileDTO;
  members: CommunityMemberSummaryDTO[];
  joinRequests: CommunityJoinRequestSummaryDTO[];
  modules: CommunityModuleSummaryDTO[];
  channels: CommunityChannelSummaryDTO[];
  categorySlug: string | null;
  tags: readonly string[];
  topic: string;
  locationMode: "online" | "stationary" | "hybrid" | null;
  locationCity: string;
  bannerGradientIdx: number;
};

type AdapterState = {
  communities: Map<string, CommunityState>;
  failure: string | null;
  seq: number;
};

function cloneSeed(seed: CommunityFixtureSeed): CommunityState {
  return {
    profile: { ...seed.profile },
    members: seed.members.map((m) => ({ ...m })),
    joinRequests: seed.joinRequests.map((r) => ({ ...r })),
    modules: seed.modules.map((m) => ({ ...m })),
    channels: seed.channels.map((c) => ({ ...c })),
    categorySlug: seed.profile.slug === "product-builders" ? "technologia"
      : seed.profile.slug === "zdrowie-ruch" ? "zdrowie"
      : seed.profile.slug === "lokalne-wydarzenia" ? "lokalne"
      : seed.profile.slug === "open-source" ? "technologia"
      : null,
    tags: [],
    topic: "",
    locationMode: null,
    locationCity: "",
    bannerGradientIdx: seed.profile.name.length % 6,
  };
}

function buildInitialState(): AdapterState {
  const communities = new Map<string, CommunityState>();
  for (const seed of COMMUNITY_SEED_FIXTURES) {
    communities.set(seed.profile.slug, cloneSeed(seed));
  }
  return { communities, failure: null, seq: 0 };
}

let state: AdapterState = buildInitialState();

function nextId(prefix: string): string {
  state.seq += 1;
  return `${prefix}-${state.seq}`;
}

function shouldFail<T>(): CommunityActionResult<T> | null {
  if (state.failure) {
    return { ok: false, error: { code: "UNKNOWN", message: state.failure } };
  }
  return null;
}

function asViewerRole(role: CommunityMemberSummaryDTO["role"]): CommunityCardDTO["viewerRole"] | undefined {
  if (role === "founder" || role === "admin" || role === "member") return role;
  return "member";
}

function toCard(community: CommunityState): CommunityCardDTO {
  const viewer = community.members.find((m) => m.userId === FIXTURE_VIEWER_USER_ID);
  return {
    id: community.profile.id,
    slug: community.profile.slug,
    name: community.profile.name,
    description: community.profile.description,
    visibility: community.profile.visibility,
    memberCount: community.profile.memberCount,
    viewerRole: viewer ? asViewerRole(viewer.role) : undefined,
    viewerRelation: community.profile.viewerRelation,
    categorySlug: community.categorySlug,
    bannerGradientIdx: community.bannerGradientIdx,
    tags: community.tags,
  };
}

function recomputeViewerRelation(community: CommunityState): void {
  const viewer = community.members.find((m) => m.userId === FIXTURE_VIEWER_USER_ID);
  if (viewer) {
    community.profile.viewerRelation = viewer.role;
    community.profile.canManage = viewer.role === "founder" || viewer.role === "admin";
    return;
  }
  const requested = community.joinRequests.some((r) => r.requesterUserId === FIXTURE_VIEWER_USER_ID);
  community.profile.viewerRelation = requested ? "requested" : "not_member";
  community.profile.canManage = false;
}

function requireCommunity<T>(slug: string): { state: CommunityState } | CommunityActionResult<T> {
  const community = state.communities.get(slug);
  if (!community) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Społeczność nie istnieje." } };
  }
  return { state: community };
}

function requireManager<T>(slug: string): { state: CommunityState } | CommunityActionResult<T> {
  const res = requireCommunity<T>(slug);
  if (!("state" in res)) return res;
  if (!res.state.profile.canManage) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Tylko founder/admin może zarządzać tą społecznością." } };
  }
  return res;
}

async function listCommunitiesShell(): Promise<CommunitiesShellData> {
  if (state.failure) throw new Error(state.failure);
  const all = [...state.communities.values()];
  const myCommunities = all
    .filter((c) => c.members.some((m) => m.userId === FIXTURE_VIEWER_USER_ID))
    .map(toCard);
  const discoverCommunities = all
    .filter((c) => !c.members.some((m) => m.userId === FIXTURE_VIEWER_USER_ID))
    .map(toCard);
  // Recommended = subset of discover, stable order by id, capped at 6.
  // SCALABILITY_EXCEPTION: bounded slice (max 6), not a write fanout.
  const recommendedCommunities = discoverCommunities.slice(0, 6);
  const categories = [...CATEGORY_CATALOG].sort((a, b) => a.sortOrder - b.sortOrder);
  return { myCommunities, discoverCommunities, recommendedCommunities, categories };
}

async function createCommunity(
  input: CreateCommunityInput,
): Promise<CommunityActionResult<CommunityProfileDTO>> {
  const fail = shouldFail<CommunityProfileDTO>();
  if (fail) return fail;
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  if (name.length < 3) {
    return { ok: false, error: { code: "VALIDATION", field: "name", message: "Nazwa musi mieć co najmniej 3 znaki." } };
  }
  if (!SLUG_RE.test(slug)) {
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        field: "slug",
        message: "Slug może zawierać tylko małe litery, cyfry i pojedyncze myślniki.",
      },
    };
  }
  if (state.communities.has(slug)) {
    return { ok: false, error: { code: "CONFLICT", message: "Ten slug jest już zajęty." } };
  }
  const id = toCommunityId(`community-${slug}`);
  const visibility = input.visibility ?? "public";
  const profile: CommunityProfileDTO = {
    id,
    slug,
    name,
    description: input.description?.trim() ?? "",
    visibility,
    memberCount: 1,
    viewerRelation: "founder",
    canManage: true,
  };
  const community: CommunityState = {
    profile,
    members: [
      {
        userId: FIXTURE_VIEWER_USER_ID,
        displayName: "Demo użytkownik",
        role: "founder",
        joinedAt: new Date().toISOString(),
      },
    ],
    joinRequests: [],
    modules: COMMUNITY_MODULE_CATALOG.map((m) => ({ ...m, enabled: m.key === "topics" || m.key === "channel_entry" })),
    channels: [],
    categorySlug: input.categorySlug ?? null,
    tags: input.tags ?? [],
    topic: input.topic ?? "",
    locationMode: input.locationMode ?? null,
    locationCity: input.locationCity ?? "",
    bannerGradientIdx: name.length % 6,
  };
  state.communities.set(slug, community);
  return { ok: true, value: { ...profile } };
}

async function getCommunityProfile(slug: string): Promise<CommunityActionResult<CommunityProfileDTO>> {
  const fail = shouldFail<CommunityProfileDTO>();
  if (fail) return fail;
  const res = requireCommunity<CommunityProfileDTO>(slug);
  if (!("state" in res)) return res;
  return { ok: true, value: { ...res.state.profile } };
}

async function updateSettings(
  input: UpdateCommunitySettingsInput,
): Promise<CommunityActionResult<CommunityProfileDTO>> {
  const fail = shouldFail<CommunityProfileDTO>();
  if (fail) return fail;
  const res = requireManager<CommunityProfileDTO>(input.slug);
  if (!("state" in res)) return res;
  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (trimmed.length < 3) {
      return { ok: false, error: { code: "VALIDATION", field: "name", message: "Nazwa musi mieć co najmniej 3 znaki." } };
    }
    res.state.profile.name = trimmed;
  }
  if (input.description !== undefined) {
    res.state.profile.description = input.description.trim();
  }
  if (input.visibility !== undefined) {
    res.state.profile.visibility = input.visibility;
  }
  return { ok: true, value: { ...res.state.profile } };
}

async function requestJoin(slug: string): Promise<CommunityActionResult<CommunityProfileDTO>> {
  const fail = shouldFail<CommunityProfileDTO>();
  if (fail) return fail;
  const res = requireCommunity<CommunityProfileDTO>(slug);
  if (!("state" in res)) return res;
  const community = res.state;
  if (community.members.some((m) => m.userId === FIXTURE_VIEWER_USER_ID)) {
    return { ok: false, error: { code: "CONFLICT", message: "Jesteś już członkiem tej społeczności." } };
  }
  if (community.joinRequests.some((r) => r.requesterUserId === FIXTURE_VIEWER_USER_ID)) {
    return { ok: false, error: { code: "CONFLICT", message: "Zgłoszenie zostało już wysłane." } };
  }
  if (community.profile.visibility === "public") {
    community.members.push({
      userId: FIXTURE_VIEWER_USER_ID,
      displayName: "Demo użytkownik",
      role: "member",
      joinedAt: new Date().toISOString(),
    });
    community.profile.memberCount = community.members.length;
  } else {
    community.joinRequests.push({
      id: nextId("jr"),
      requesterUserId: FIXTURE_VIEWER_USER_ID,
      requesterDisplayName: "Demo użytkownik",
      createdAt: new Date().toISOString(),
    });
  }
  recomputeViewerRelation(community);
  return { ok: true, value: { ...community.profile } };
}

async function listMembers(slug: string): Promise<CommunityActionResult<CommunityMemberSummaryDTO[]>> {
  const fail = shouldFail<CommunityMemberSummaryDTO[]>();
  if (fail) return fail;
  const res = requireCommunity<CommunityMemberSummaryDTO[]>(slug);
  if (!("state" in res)) return res;
  return { ok: true, value: res.state.members.map((m) => ({ ...m })) };
}

async function listPendingJoinRequests(slug: string): Promise<CommunityActionResult<CommunityJoinRequestSummaryDTO[]>> {
  const fail = shouldFail<CommunityJoinRequestSummaryDTO[]>();
  if (fail) return fail;
  const res = requireManager<CommunityJoinRequestSummaryDTO[]>(slug);
  if (!("state" in res)) return res;
  return { ok: true, value: res.state.joinRequests.map((r) => ({ ...r })) };
}

function decideJoinRequest(
  input: DecideJoinRequestInput,
  accept: boolean,
): CommunityActionResult<CommunityJoinRequestSummaryDTO[]> {
  const res = requireManager<CommunityJoinRequestSummaryDTO[]>(input.communitySlug);
  if (!("state" in res)) return res;
  const community = res.state;
  const idx = community.joinRequests.findIndex((r) => r.id === input.joinRequestId);
  if (idx === -1) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Zgłoszenie nie istnieje." } };
  }
  const [request] = community.joinRequests.splice(idx, 1);
  if (accept) {
    community.members.push({
      userId: request.requesterUserId,
      displayName: request.requesterDisplayName,
      role: "member",
      joinedAt: new Date().toISOString(),
    });
    community.profile.memberCount = community.members.length;
  }
  recomputeViewerRelation(community);
  return { ok: true, value: community.joinRequests.map((r) => ({ ...r })) };
}

async function acceptJoinRequest(input: DecideJoinRequestInput) {
  const fail = shouldFail<CommunityJoinRequestSummaryDTO[]>();
  if (fail) return fail;
  return decideJoinRequest(input, true);
}

async function rejectJoinRequest(input: DecideJoinRequestInput) {
  const fail = shouldFail<CommunityJoinRequestSummaryDTO[]>();
  if (fail) return fail;
  return decideJoinRequest(input, false);
}

async function listModules(slug: string): Promise<CommunityActionResult<CommunityModuleSummaryDTO[]>> {
  const fail = shouldFail<CommunityModuleSummaryDTO[]>();
  if (fail) return fail;
  const res = requireCommunity<CommunityModuleSummaryDTO[]>(slug);
  if (!("state" in res)) return res;
  return { ok: true, value: res.state.modules.map((m) => ({ ...m })) };
}

async function toggleModule(
  input: ToggleCommunityModuleInput,
): Promise<CommunityActionResult<CommunityModuleSummaryDTO[]>> {
  const fail = shouldFail<CommunityModuleSummaryDTO[]>();
  if (fail) return fail;
  const res = requireManager<CommunityModuleSummaryDTO[]>(input.communitySlug);
  if (!("state" in res)) return res;
  const community = res.state;
  const module = community.modules.find((m) => m.key === input.moduleKey);
  if (!module) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Nieznany moduł." } };
  }
  module.enabled = input.enabled;
  return { ok: true, value: community.modules.map((m) => ({ ...m })) };
}

async function listChannels(slug: string): Promise<CommunityActionResult<CommunityChannelSummaryDTO[]>> {
  const fail = shouldFail<CommunityChannelSummaryDTO[]>();
  if (fail) return fail;
  const res = requireCommunity<CommunityChannelSummaryDTO[]>(slug);
  if (!("state" in res)) return res;
  return { ok: true, value: res.state.channels.map((c) => ({ ...c })) };
}

async function createChannel(
  input: CreateCommunityChannelInput,
): Promise<CommunityActionResult<CommunityChannelSummaryDTO>> {
  const fail = shouldFail<CommunityChannelSummaryDTO>();
  if (fail) return fail;
  const res = requireManager<CommunityChannelSummaryDTO>(input.communitySlug);
  if (!("state" in res)) return res;
  const community = res.state;
  const slug = input.slug.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) {
    return { ok: false, error: { code: "VALIDATION", field: "slug", message: "Niepoprawny slug kanału." } };
  }
  if (community.channels.some((c) => c.slug === slug)) {
    return { ok: false, error: { code: "CONFLICT", message: "Kanał o tym slug już istnieje w społeczności." } };
  }
  const channel: CommunityChannelSummaryDTO = {
    id: nextId(`ch-${community.profile.slug}`),
    slug,
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    visibility: input.visibility ?? "public",
    followerCount: 0,
    viewerFollows: false,
  };
  community.channels.push(channel);
  return { ok: true, value: { ...channel } };
}

async function setFollow(
  slug: string,
  channelId: string,
  follow: boolean,
): Promise<CommunityActionResult<CommunityChannelSummaryDTO>> {
  const fail = shouldFail<CommunityChannelSummaryDTO>();
  if (fail) return fail;
  const res = requireCommunity<CommunityChannelSummaryDTO>(slug);
  if (!("state" in res)) return res;
  const channel = res.state.channels.find((c) => c.id === channelId);
  if (!channel) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Kanał nie istnieje." } };
  }
  if (channel.viewerFollows === follow) {
    return { ok: true, value: { ...channel } };
  }
  channel.viewerFollows = follow;
  channel.followerCount += follow ? 1 : -1;
  if (channel.followerCount < 0) channel.followerCount = 0;
  return { ok: true, value: { ...channel } };
}

async function changeMemberRole(
  input: ChangeCommunityMemberRoleInput,
): Promise<CommunityActionResult<CommunityMemberSummaryDTO[]>> {
  const fail = shouldFail<CommunityMemberSummaryDTO[]>();
  if (fail) return fail;
  const res = requireManager<CommunityMemberSummaryDTO[]>(input.communitySlug);
  if (!("state" in res)) return res;
  const community = res.state;
  const member = community.members.find((m) => m.userId === input.targetUserId);
  if (!member) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Członek nie istnieje." } };
  }
  if (member.role === "founder") {
    return { ok: false, error: { code: "FORBIDDEN", message: "Roli foundera nie można zmienić." } };
  }
  member.role = input.nextRole;
  return { ok: true, value: community.members.map((m) => ({ ...m })) };
}

async function getCommunityHub(slug: string): Promise<CommunityActionResult<CommunityHubViewDTO>> {
  const fail = shouldFail<CommunityHubViewDTO>();
  if (fail) return fail;
  const res = requireCommunity<CommunityHubViewDTO>(slug);
  if (!("state" in res)) return res;
  const community = res.state;
  if (community.profile.visibility === "private" && community.profile.viewerRelation === "not_member") {
    return { ok: false, error: { code: "FORBIDDEN", message: "Hub prywatnej społeczności jest niewidoczny dla gości." } };
  }
  return {
    ok: true,
    value: buildHubViewFromSeed({
      profile: community.profile,
      members: community.members,
      joinRequests: community.joinRequests,
      modules: community.modules,
      channels: community.channels,
    }),
  };
}

export type CommunitiesMockAdapter = {
  listCommunitiesShell(): Promise<CommunitiesShellData>;
  listCategories(): Promise<readonly CommunityCategoryDTO[]>;
  createCommunity(input: CreateCommunityInput): Promise<CommunityActionResult<CommunityProfileDTO>>;
  getCommunityProfile(slug: string): Promise<CommunityActionResult<CommunityProfileDTO>>;
  updateSettings(input: UpdateCommunitySettingsInput): Promise<CommunityActionResult<CommunityProfileDTO>>;
  requestJoin(slug: string): Promise<CommunityActionResult<CommunityProfileDTO>>;
  listMembers(slug: string): Promise<CommunityActionResult<CommunityMemberSummaryDTO[]>>;
  changeMemberRole(input: ChangeCommunityMemberRoleInput): Promise<CommunityActionResult<CommunityMemberSummaryDTO[]>>;
  listPendingJoinRequests(slug: string): Promise<CommunityActionResult<CommunityJoinRequestSummaryDTO[]>>;
  acceptJoinRequest(input: DecideJoinRequestInput): Promise<CommunityActionResult<CommunityJoinRequestSummaryDTO[]>>;
  rejectJoinRequest(input: DecideJoinRequestInput): Promise<CommunityActionResult<CommunityJoinRequestSummaryDTO[]>>;
  listModules(slug: string): Promise<CommunityActionResult<CommunityModuleSummaryDTO[]>>;
  toggleModule(input: ToggleCommunityModuleInput): Promise<CommunityActionResult<CommunityModuleSummaryDTO[]>>;
  listChannels(slug: string): Promise<CommunityActionResult<CommunityChannelSummaryDTO[]>>;
  createChannel(input: CreateCommunityChannelInput): Promise<CommunityActionResult<CommunityChannelSummaryDTO>>;
  followChannel(slug: string, channelId: string): Promise<CommunityActionResult<CommunityChannelSummaryDTO>>;
  unfollowChannel(slug: string, channelId: string): Promise<CommunityActionResult<CommunityChannelSummaryDTO>>;
  getCommunityHub(slug: string): Promise<CommunityActionResult<CommunityHubViewDTO>>;
  __setDataForTests(data: CommunitiesShellData): void;
  __setFailureForTests(message: string | null): void;
  __resetForTests(): void;
};

async function listCategoriesImpl(): Promise<readonly CommunityCategoryDTO[]> {
  return [...CATEGORY_CATALOG].sort((a, b) => a.sortOrder - b.sortOrder);
}

export const communitiesMockAdapter: CommunitiesMockAdapter = {
  listCommunitiesShell,
  listCategories: listCategoriesImpl,
  createCommunity,
  getCommunityProfile,
  updateSettings,
  requestJoin,
  listMembers,
  changeMemberRole,
  listPendingJoinRequests,
  acceptJoinRequest,
  rejectJoinRequest,
  listModules,
  toggleModule,
  listChannels,
  createChannel,
  followChannel: (slug, channelId) => setFollow(slug, channelId, true),
  unfollowChannel: (slug, channelId) => setFollow(slug, channelId, false),
  getCommunityHub,
  __setDataForTests(data) {
    state = { ...buildInitialState(), failure: null };
    state.communities = new Map();
    for (const card of [...data.myCommunities, ...data.discoverCommunities]) {
      const seed: CommunityFixtureSeed = {
        profile: {
          id: card.id,
          slug: card.slug,
          name: card.name,
          description: card.description,
          visibility: card.visibility,
          memberCount: card.memberCount,
          viewerRelation: card.viewerRelation ?? "not_member",
          canManage: card.viewerRole === "founder" || card.viewerRole === "admin",
        },
        members: card.viewerRole
          ? [
              {
                userId: FIXTURE_VIEWER_USER_ID,
                displayName: "Demo użytkownik",
                role: card.viewerRole,
                joinedAt: new Date().toISOString(),
              },
            ]
          : [],
        joinRequests: [],
        modules: COMMUNITY_MODULE_CATALOG.map((m) => ({ ...m })),
        channels: [],
      };
      state.communities.set(card.slug, cloneSeed(seed));
    }
  },
  __setFailureForTests(message) {
    state.failure = message;
  },
  __resetForTests() {
    state = buildInitialState();
  },
};
