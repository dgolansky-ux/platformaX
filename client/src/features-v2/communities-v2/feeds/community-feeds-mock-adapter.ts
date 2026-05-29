/**
 * features-v2/communities-v2 / community-feeds-mock-adapter — MOCK_LOCAL_ONLY
 * transport for Communities Slice 5 (three feeds + descendant publishing).
 *
 * No HTTP transport yet (TRANSPORT_PARTIAL). This adapter holds in-memory feed
 * items + per-community feed settings seeded for the demo viewer (founder of
 * "product-builders"), and enforces the SAME rules the domain enforces:
 * posting policy, relational monthly quota (backend-side here, never trusted
 * from UI), staff-only visibility, and descendant distribution with dedupe.
 * NO `@server/*` imports. NO fake save — every mutation changes this store.
 */
import type {
  CommunityFeedActionResult,
  CommunityFeedItemDTO,
  CommunityFeedSettingsDTO,
  CommunityFeedTabsStateDTO,
  CommunityFeedType,
  DescendantPublishTargetDTO,
  ListCommunityFeedResultDTO,
  PublishCommunityPostFrontendInput,
  PublishCommunityPostResultDTO,
  UpdateCommunityFeedSettingsFrontendInput,
} from "@shared/contracts/community-feeds";

const VIEWER_ID = "u-viewer-demo";
const VIEWER_NAME = "Demo użytkownik";
type Role = "founder" | "admin" | "moderator" | "member" | null;

type Community = {
  id: string;
  slug: string;
  name: string;
  viewerRole: Role;
  settings: CommunityFeedSettingsDTO;
  directChildIds: readonly string[];
  descendants: readonly DescendantPublishTargetDTO[];
};

type State = {
  communities: Map<string, Community>; // keyed by slug
  byId: Map<string, Community>;
  items: Map<string, CommunityFeedItemDTO[]>; // keyed by communityId
  dedupe: Set<string>;
  failure: string | null;
  seq: number;
  now: Date;
};

function defaults(communityId: string): CommunityFeedSettingsDTO {
  return {
    communityId,
    communityAllEnabled: true,
    communityAllPostingPolicy: "all_members",
    relationalEnabled: false,
    relationalMonthlyLimit: 3,
    staffOnlyEnabled: true,
    descendantPublishingEnabled: true,
    descendantPublishingAllowedRoles: ["founder", "admin"],
  };
}

function seed(): State {
  const mk = (id: string, slug: string, name: string, viewerRole: Role, directChildIds: string[], descendants: DescendantPublishTargetDTO[]): Community => ({
    id, slug, name, viewerRole, settings: defaults(id), directChildIds, descendants,
  });
  const fe: DescendantPublishTargetDTO = { id: "fe", slug: "pb-frontend-guild", name: "Frontend Guild", depth: 1 };
  const be: DescendantPublishTargetDTO = { id: "be", slug: "pb-backend-guild", name: "Backend Guild", depth: 1 };
  const react: DescendantPublishTargetDTO = { id: "react", slug: "pb-react-squad", name: "React Squad", depth: 2 };
  const list = [
    mk("pb", "product-builders", "Product Builders", "founder", ["fe", "be"], [fe, be, react]),
    mk("fe", "pb-frontend-guild", "Frontend Guild", "founder", ["react"], [react]),
    mk("be", "pb-backend-guild", "Backend Guild", "founder", [], []),
    mk("react", "pb-react-squad", "React Squad", "founder", [], []),
    mk("zr", "zdrowie-ruch", "Zdrowie i Ruch", "member", [], []),
  ];
  const communities = new Map<string, Community>();
  const byId = new Map<string, Community>();
  for (const c of list) { communities.set(c.slug, c); byId.set(c.id, c); }
  const items = new Map<string, CommunityFeedItemDTO[]>();
  const state: State = { communities, byId, items, dedupe: new Set(), failure: null, seq: 0, now: new Date("2026-05-29T10:00:00.000Z") };
  // seed a couple of main-feed posts in the root
  pushItem(state, makeItem(state, "pb", "community_all", "Witajcie w Product Builders! 🚀", "pb"));
  pushItem(state, makeItem(state, "pb", "staff_only", "Notatka kadry: plan na maj.", "pb"));
  return state;
}

function makeItem(state: State, communityId: string, feedType: CommunityFeedType, body: string, sourceCommunityId: string): CommunityFeedItemDTO {
  state.seq += 1;
  const source = state.byId.get(sourceCommunityId);
  return {
    id: `fi-${state.seq}`, postId: `p-${state.seq}`, communityId, feedType,
    authorUserId: VIEWER_ID, authorDisplayName: VIEWER_NAME, publishedByUserId: VIEWER_ID,
    body, mediaRefs: [], sourceCommunityId,
    sourceCommunityName: sourceCommunityId === communityId ? null : (source?.name ?? null),
    distributionId: null, isDistributed: sourceCommunityId !== communityId,
    createdAt: new Date(state.now.getTime() - state.seq * 1000).toISOString(),
  };
}

function pushItem(state: State, item: CommunityFeedItemDTO): void {
  const arr = state.items.get(item.communityId) ?? [];
  arr.push(item);
  state.items.set(item.communityId, arr);
}

let state: State = seed();

function isStaff(role: Role): boolean {
  return role === "founder" || role === "admin" || role === "moderator";
}

function canPost(role: Role, settings: CommunityFeedSettingsDTO, feedType: CommunityFeedType): boolean {
  if (feedType === "community_all") return settings.communityAllEnabled && role !== null && (settings.communityAllPostingPolicy === "all_members" || isStaff(role));
  if (feedType === "relational") return settings.relationalEnabled && role !== null;
  return settings.staffOnlyEnabled && isStaff(role);
}

function canView(role: Role, settings: CommunityFeedSettingsDTO, feedType: CommunityFeedType): boolean {
  if (feedType === "community_all") return settings.communityAllEnabled && role !== null;
  if (feedType === "relational") return settings.relationalEnabled && role !== null;
  return settings.staffOnlyEnabled && isStaff(role);
}

function canPublishDown(role: Role, settings: CommunityFeedSettingsDTO, feedType: CommunityFeedType): boolean {
  if (feedType !== "community_all" && feedType !== "staff_only") return false;
  if (!settings.descendantPublishingEnabled || role === null) return false;
  return (settings.descendantPublishingAllowedRoles as readonly string[]).includes(role);
}

function relationalUsed(communityId: string): number {
  const month = state.now.toISOString().slice(0, 7);
  return (state.items.get(communityId) ?? []).filter(
    (i) => i.feedType === "relational" && i.authorUserId === VIEWER_ID && i.createdAt.slice(0, 7) === month,
  ).length;
}

function fail<T>(): CommunityFeedActionResult<T> | null {
  return state.failure ? { ok: false, error: { code: "UNKNOWN", message: state.failure } } : null;
}

async function getFeedTabsState(slug: string): Promise<CommunityFeedActionResult<CommunityFeedTabsStateDTO>> {
  const f = fail<CommunityFeedTabsStateDTO>(); if (f) return f;
  const c = state.communities.get(slug);
  if (!c) return { ok: false, error: { code: "NOT_FOUND", message: "Społeczność nie istnieje." } };
  const used = c.settings.relationalEnabled ? relationalUsed(c.id) : 0;
  return {
    ok: true,
    value: {
      communityId: c.id,
      communityAll: { visible: canView(c.viewerRole, c.settings, "community_all"), canPost: canPost(c.viewerRole, c.settings, "community_all") },
      relational: {
        visible: canView(c.viewerRole, c.settings, "relational"),
        canPost: canPost(c.viewerRole, c.settings, "relational") && used < c.settings.relationalMonthlyLimit,
        monthlyLimit: c.settings.relationalMonthlyLimit, usedThisMonth: used, remaining: Math.max(0, c.settings.relationalMonthlyLimit - used),
      },
      staffOnly: { visible: canView(c.viewerRole, c.settings, "staff_only"), canPost: canPost(c.viewerRole, c.settings, "staff_only") },
      canPublishToDescendants: canPublishDown(c.viewerRole, c.settings, "community_all") || canPublishDown(c.viewerRole, c.settings, "staff_only"),
    },
  };
}

async function listFeed(slug: string, feedType: CommunityFeedType): Promise<CommunityFeedActionResult<ListCommunityFeedResultDTO>> {
  const f = fail<ListCommunityFeedResultDTO>(); if (f) return f;
  const c = state.communities.get(slug);
  if (!c) return { ok: false, error: { code: "NOT_FOUND", message: "Społeczność nie istnieje." } };
  if (!canView(c.viewerRole, c.settings, feedType)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Nie masz dostępu do tego feedu." } };
  }
  const items = (state.items.get(c.id) ?? []).filter((i) => i.feedType === feedType)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : a.id < b.id ? 1 : -1));
  return { ok: true, value: { items, nextCursor: null } };
}

async function listDescendantTargets(slug: string): Promise<CommunityFeedActionResult<readonly DescendantPublishTargetDTO[]>> {
  const f = fail<readonly DescendantPublishTargetDTO[]>(); if (f) return f;
  const c = state.communities.get(slug);
  if (!c) return { ok: false, error: { code: "NOT_FOUND", message: "Społeczność nie istnieje." } };
  return { ok: true, value: c.descendants };
}

function resolveTargets(c: Community, input: PublishCommunityPostFrontendInput): string[] | { error: string } {
  if (input.scope === "current_community_only") return [];
  if (input.scope === "direct_children") return [...c.directChildIds];
  if (input.scope === "all_descendants") return c.descendants.map((d) => d.id);
  const allowed = new Set(c.descendants.map((d) => d.id));
  for (const id of input.selectedDescendantCommunityIds ?? []) {
    if (!allowed.has(id)) return { error: "Wybrany cel nie jest podspołecznością tej struktury." };
  }
  return [...(input.selectedDescendantCommunityIds ?? [])];
}

async function publishPost(input: PublishCommunityPostFrontendInput): Promise<CommunityFeedActionResult<PublishCommunityPostResultDTO>> {
  const f = fail<PublishCommunityPostResultDTO>(); if (f) return f;
  const c = state.communities.get(input.communitySlug);
  if (!c) return { ok: false, error: { code: "NOT_FOUND", message: "Społeczność nie istnieje." } };
  if (input.body.trim().length === 0) return { ok: false, error: { code: "VALIDATION", field: "body", message: "Treść posta nie może być pusta." } };
  if (!canPost(c.viewerRole, c.settings, input.feedType)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Nie możesz publikować w tym feedzie." } };
  }
  if (input.feedType === "relational") {
    if (input.scope !== "current_community_only") return { ok: false, error: { code: "VALIDATION", field: "scope", message: "Feed relacyjny nie propaguje się w dół struktury." } };
    if (relationalUsed(c.id) >= c.settings.relationalMonthlyLimit) return { ok: false, error: { code: "CONFLICT", message: `Miesięczny limit feedu relacyjnego (${c.settings.relationalMonthlyLimit}) wyczerpany.` } };
  }
  let targets: string[] = [];
  if (input.scope !== "current_community_only") {
    if (input.feedType === "relational") return { ok: false, error: { code: "VALIDATION", field: "scope", message: "Feed relacyjny nie propaguje się w dół." } };
    if (!canPublishDown(c.viewerRole, c.settings, input.feedType)) return { ok: false, error: { code: "FORBIDDEN", message: "Nie możesz publikować do podspołeczności." } };
    const resolved = resolveTargets(c, input);
    if (!Array.isArray(resolved)) return { ok: false, error: { code: "VALIDATION", field: "targets", message: resolved.error } };
    targets = resolved;
  }
  const distributionId = targets.length > 0 ? `d-${++state.seq}` : null;
  const source = makeItem(state, c.id, input.feedType, input.body.trim(), c.id);
  source.distributionId = distributionId;
  pushItem(state, source);
  let distributedCount = 0;
  const reached: string[] = [];
  for (const targetId of targets) {
    const key = `${targetId}|${input.feedType}|${distributionId}`;
    if (state.dedupe.has(key)) continue;
    state.dedupe.add(key);
    const item = makeItem(state, targetId, input.feedType, input.body.trim(), c.id);
    item.distributionId = distributionId;
    item.postId = source.postId;
    pushItem(state, item);
    distributedCount += 1;
    reached.push(targetId);
  }
  return { ok: true, value: { item: source, distributedCount, targetCommunityIds: reached } };
}

async function getFeedSettings(slug: string): Promise<CommunityFeedActionResult<CommunityFeedSettingsDTO>> {
  const f = fail<CommunityFeedSettingsDTO>(); if (f) return f;
  const c = state.communities.get(slug);
  if (!c) return { ok: false, error: { code: "NOT_FOUND", message: "Społeczność nie istnieje." } };
  return { ok: true, value: { ...c.settings } };
}

async function updateFeedSettings(input: UpdateCommunityFeedSettingsFrontendInput): Promise<CommunityFeedActionResult<CommunityFeedSettingsDTO>> {
  const f = fail<CommunityFeedSettingsDTO>(); if (f) return f;
  const c = state.communities.get(input.communitySlug);
  if (!c) return { ok: false, error: { code: "NOT_FOUND", message: "Społeczność nie istnieje." } };
  if (!(c.viewerRole === "founder" || c.viewerRole === "admin")) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Tylko founder/admin może zmieniać ustawienia feedów." } };
  }
  if (input.relationalMonthlyLimit !== undefined && (!Number.isInteger(input.relationalMonthlyLimit) || input.relationalMonthlyLimit < 1 || input.relationalMonthlyLimit > 10)) {
    return { ok: false, error: { code: "VALIDATION", field: "relationalMonthlyLimit", message: "Limit musi być z zakresu 1–10." } };
  }
  c.settings = {
    ...c.settings,
    communityAllEnabled: input.communityAllEnabled ?? c.settings.communityAllEnabled,
    communityAllPostingPolicy: input.communityAllPostingPolicy ?? c.settings.communityAllPostingPolicy,
    relationalEnabled: input.relationalEnabled ?? c.settings.relationalEnabled,
    relationalMonthlyLimit: input.relationalMonthlyLimit ?? c.settings.relationalMonthlyLimit,
    staffOnlyEnabled: input.staffOnlyEnabled ?? c.settings.staffOnlyEnabled,
    descendantPublishingEnabled: input.descendantPublishingEnabled ?? c.settings.descendantPublishingEnabled,
  };
  return { ok: true, value: { ...c.settings } };
}

export type CommunityFeedsMockAdapter = {
  getFeedTabsState(slug: string): Promise<CommunityFeedActionResult<CommunityFeedTabsStateDTO>>;
  listFeed(slug: string, feedType: CommunityFeedType): Promise<CommunityFeedActionResult<ListCommunityFeedResultDTO>>;
  listDescendantTargets(slug: string): Promise<CommunityFeedActionResult<readonly DescendantPublishTargetDTO[]>>;
  publishPost(input: PublishCommunityPostFrontendInput): Promise<CommunityFeedActionResult<PublishCommunityPostResultDTO>>;
  getFeedSettings(slug: string): Promise<CommunityFeedActionResult<CommunityFeedSettingsDTO>>;
  updateFeedSettings(input: UpdateCommunityFeedSettingsFrontendInput): Promise<CommunityFeedActionResult<CommunityFeedSettingsDTO>>;
  __setFailureForTests(message: string | null): void;
  __resetForTests(): void;
};

export const communityFeedsMockAdapter: CommunityFeedsMockAdapter = {
  getFeedTabsState,
  listFeed,
  listDescendantTargets,
  publishPost,
  getFeedSettings,
  updateFeedSettings,
  __setFailureForTests(message) { state.failure = message; },
  __resetForTests() { state = seed(); },
};
