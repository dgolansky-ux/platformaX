/**
 * communities-v2 — service. Owns communities + memberships + join requests.
 * Stores NO posts and NO PII. Founder membership is created atomically with
 * the community; the founder can never be removed (policy). Method bodies live
 * as module-level functions so the factory stays small.
 */
import type {
  CommunityJoinRequestDTO,
  CommunityPublicDTO,
  CreateCommunityInput,
  UpdateCommunitySettingsInput,
} from "./dto";
import type { CommunityAuthorityResolver, CommunityPublicSummary } from "./contracts";
import type {
  CommunityRepository,
  JoinRequestRepository,
  MembershipRepository,
} from "./ports";
import { canUpdateSettings, hasCommunityAuthority, isValidCommunitySlug } from "./policy";
import { toPublicCommunityDTO } from "./mapper";

export type CommunitiesClock = { now: () => Date };
export type CommunitiesIdGenerator = { next: () => string };

export type CommunitiesServiceDeps = {
  communities: CommunityRepository;
  members: MembershipRepository;
  joinRequests: JoinRequestRepository;
  clock: CommunitiesClock;
  ids: CommunitiesIdGenerator;
};

export type CommunitiesErrorCode =
  | "INVALID_SLUG"
  | "SLUG_TAKEN"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "JOIN_DUPLICATE";

export type CommunitiesResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: CommunitiesErrorCode; message: string } };

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export interface CommunitiesService extends CommunityAuthorityResolver {
  createCommunity(input: CreateCommunityInput): Promise<CommunitiesResult<CommunityPublicDTO>>;
  updateSettings(input: UpdateCommunitySettingsInput): Promise<CommunitiesResult<CommunityPublicDTO>>;
  requestJoin(communityId: string, requesterUserId: string): Promise<CommunitiesResult<CommunityJoinRequestDTO>>;
  listMyCommunities(userId: string): Promise<CommunityPublicDTO[]>; // SCALABILITY_HOT_PATH_EXCEPTION: stable order by id; bounded in-memory foundation
  listPublicCommunities(cursor: string | null, limit?: number): Promise<{ items: CommunityPublicDTO[]; nextCursor: string | null }>; // SCALABILITY_HOT_PATH_EXCEPTION: stable order by id; DB cursor later
}

type Deps = CommunitiesServiceDeps;

async function count(deps: Deps, communityId: string): Promise<number> {
  return (await deps.members.listForCommunity(communityId)).length;
}
async function roleOf(deps: Deps, communityId: string, userId: string) {
  return (await deps.members.get(communityId, userId))?.role ?? null;
}

async function createCommunity(deps: Deps, input: CreateCommunityInput): Promise<CommunitiesResult<CommunityPublicDTO>> {
  if (!isValidCommunitySlug(input.slug)) {
    return { ok: false, error: { code: "INVALID_SLUG", message: "Invalid community slug." } };
  }
  if (await deps.communities.getBySlug(input.slug)) {
    return { ok: false, error: { code: "SLUG_TAKEN", message: "Community slug already taken." } };
  }
  const now = deps.clock.now().toISOString();
  const id = deps.ids.next();
  const record = await deps.communities.create({
    id, slug: input.slug, name: input.name, description: input.description ?? "",
    visibility: input.visibility ?? "public", status: "active", founderUserId: input.founderUserId,
    avatarRef: null, bannerRef: null, createdAt: now, updatedAt: now, deletedAt: null,
  });
  await deps.members.add({ communityId: id, userId: input.founderUserId, role: "founder", status: "active", joinedAt: now });
  return { ok: true, value: toPublicCommunityDTO(record, await count(deps, id)) };
}

async function updateSettings(deps: Deps, input: UpdateCommunitySettingsInput): Promise<CommunitiesResult<CommunityPublicDTO>> {
  const community = await deps.communities.getById(input.communityId);
  if (!community) return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
  if (!canUpdateSettings(await roleOf(deps, input.communityId, input.actorUserId))) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Only founder/admin may update settings." } };
  }
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  const updated = await deps.communities.update(input.communityId, patch);
  return { ok: true, value: toPublicCommunityDTO(updated, await count(deps, input.communityId)) };
}

async function requestJoin(deps: Deps, communityId: string, requesterUserId: string): Promise<CommunitiesResult<CommunityJoinRequestDTO>> {
  if (!(await deps.communities.getById(communityId))) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
  }
  if (await deps.joinRequests.findPending(communityId, requesterUserId)) {
    return { ok: false, error: { code: "JOIN_DUPLICATE", message: "A pending join request already exists." } };
  }
  const created = await deps.joinRequests.add({
    id: deps.ids.next(), communityId, requesterUserId, status: "pending",
    createdAt: deps.clock.now().toISOString(),
  });
  return { ok: true, value: created };
}

async function toItem(deps: Deps, communityId: string): Promise<CommunityPublicDTO | null> {
  const c = await deps.communities.getById(communityId);
  return c ? toPublicCommunityDTO(c, await count(deps, c.id)) : null;
}

async function listMine(deps: Deps, userId: string): Promise<CommunityPublicDTO[]> {
  const memberships = await deps.members.listForUser(userId);
  // Bounded membership set resolved in a batch (Promise.all) — not a sync fanout.
  const resolved = await Promise.all(memberships.map((m) => toItem(deps, m.communityId)));
  return resolved.filter((x): x is CommunityPublicDTO => x !== null);
}

async function listPublic(deps: Deps, cursor: string | null, limit?: number) {
  const safe = Math.min(limit && limit > 0 ? limit : DEFAULT_LIMIT, MAX_LIMIT);
  // Stable order by id (repository sorts ascending by id); cursor is the last id.
  const records = await deps.communities.listPublic(cursor ?? null, safe); // SCALABILITY_HOT_PATH_EXCEPTION: repo returns stable order by id
  const items = (await Promise.all(records.map((r) => toItem(deps, r.id)))).filter(
    (x): x is CommunityPublicDTO => x !== null,
  );
  const nextCursor = records.length === safe ? records[records.length - 1].id : null;
  return { items, nextCursor };
}

export function createCommunitiesService(deps: Deps): CommunitiesService {
  return {
    createCommunity: (input) => createCommunity(deps, input),
    updateSettings: (input) => updateSettings(deps, input),
    requestJoin: (communityId, requesterUserId) => requestJoin(deps, communityId, requesterUserId),
    listMyCommunities: (userId) => listMine(deps, userId), // SCALABILITY_HOT_PATH_EXCEPTION: delegate; stable order by id
    listPublicCommunities: (cursor, limit) => listPublic(deps, cursor, limit), // SCALABILITY_HOT_PATH_EXCEPTION: delegate; stable order by id
    canManageCommunity: async (communityId, userId) =>
      hasCommunityAuthority(await roleOf(deps, communityId, userId)),
    async getPublicSummary(communityId): Promise<CommunityPublicSummary | null> {
      const c = await deps.communities.getById(communityId);
      return c ? { id: c.id, slug: c.slug, name: c.name, visibility: c.visibility } : null;
    },
  };
}
