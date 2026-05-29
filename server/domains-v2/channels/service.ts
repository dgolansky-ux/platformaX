/** channels — service. Owns channels, leads (1–5 active), and follows. */
import type {
  AssignChannelLeadInput,
  ChannelFollowDTO,
  ChannelLeadDTO,
  ChannelPublicDTO,
  CreateChannelInput,
  RevokeChannelLeadInput,
  UpdateChannelLeadPermissionsInput,
  UpdateChannelProfileInput,
} from "./dto";
import { MAX_ACTIVE_LEADS, MIN_ACTIVE_LEADS } from "./contracts";
import { toChannelLeadDTO, toChannelPublicDTO } from "./mapper";
import { channelSummary, listSummariesByRefs, pageToPublic } from "./service-read";
import type {
  ChannelLeadRepository,
  ChannelRepository,
  FollowRepository,
} from "./ports";
import {
  canAddMoreLeads,
  canRemoveLead,
  hasCommunityOwner,
  isValidChannelSlug,
  isValidLeadRole,
  normalizeLeadPermissions,
} from "./policy";

export type ChannelsClock = { now: () => Date };
export type ChannelsIdGenerator = { next: () => string };
export type ChannelsServiceDeps = {
  channels: ChannelRepository;
  leads: ChannelLeadRepository;
  follows: FollowRepository;
  clock: ChannelsClock;
  ids: ChannelsIdGenerator;
};

export type ChannelsErrorCode =
  | "INVALID_SLUG"
  | "SLUG_TAKEN"
  | "MISSING_OWNER"
  | "NOT_FOUND"
  | "INVALID_LEAD_ROLE"
  | "LEAD_LIMIT_REACHED"
  | "CANNOT_REMOVE_LAST_LEAD"
  | "LEAD_NOT_FOUND"
  | "MISSING_INITIAL_LEAD";

export type ChannelsResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ChannelsErrorCode; message: string } };

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export interface ChannelsService {
  createChannelForCommunity(input: CreateChannelInput): Promise<ChannelsResult<ChannelPublicDTO>>;
  updateChannelProfile(input: UpdateChannelProfileInput): Promise<ChannelsResult<ChannelPublicDTO>>;
  archiveChannel(channelId: string): Promise<ChannelsResult<ChannelPublicDTO>>;
  assignChannelLead(input: AssignChannelLeadInput): Promise<ChannelsResult<ChannelLeadDTO>>;
  revokeChannelLead(input: RevokeChannelLeadInput): Promise<ChannelsResult<{ revoked: boolean }>>;
  updateChannelLeadPermissions(input: UpdateChannelLeadPermissionsInput): Promise<ChannelsResult<ChannelLeadDTO>>;
  listChannelLeads(channelId: string): Promise<ChannelsResult<ChannelLeadDTO[]>>;
  followChannel(channelId: string, followerUserId: string): Promise<ChannelsResult<ChannelFollowDTO>>;
  unfollowChannel(channelId: string, followerUserId: string): Promise<ChannelsResult<ChannelFollowDTO>>;
  getPublicSummary(channelId: string): Promise<ChannelPublicDTO | null>;
  listForCommunity(communityId: string, cursor: string | null, limit?: number): Promise<{ items: ChannelPublicDTO[]; nextCursor: string | null }>; // stable order by id
  listAllActive(cursor: string | null, limit?: number): Promise<{ items: ChannelPublicDTO[]; nextCursor: string | null }>; // stable order by id
  listFollowedByUser(userId: string): Promise<ChannelPublicDTO[]>;
  listLedByUser(userId: string): Promise<ChannelPublicDTO[]>;
  isUserActiveLead(channelId: string, userId: string): Promise<boolean>;
}

type Deps = ChannelsServiceDeps;

function fail<T>(code: ChannelsErrorCode, message: string): ChannelsResult<T> {
  return { ok: false, error: { code, message } };
}

async function setFollow(deps: Deps, channelId: string, followerUserId: string, active: boolean): Promise<ChannelsResult<ChannelFollowDTO>> {
  if (!(await deps.channels.getById(channelId))) {
    return fail("NOT_FOUND", "Channel not found.");
  }
  const record: ChannelFollowDTO = {
    channelId,
    followerUserId,
    status: active ? "active" : "unfollowed",
    createdAt: deps.clock.now().toISOString(),
  };
  await deps.follows.upsert(record);
  return { ok: true, value: record };
}

async function createChannelForCommunity(deps: Deps, input: CreateChannelInput): Promise<ChannelsResult<ChannelPublicDTO>> {
  if (!hasCommunityOwner(input.ownerType, input.ownerId)) {
    return fail("MISSING_OWNER", "A channel must be owned by a community.");
  }
  if (!isValidChannelSlug(input.slug)) {
    return fail("INVALID_SLUG", "Invalid channel slug.");
  }
  if (input.initialLeadUserId.trim().length === 0) {
    return fail("MISSING_INITIAL_LEAD", "Channel must be created with at least one lead.");
  }
  if (await deps.channels.findByOwnerSlug(input.ownerId, input.slug)) {
    return fail("SLUG_TAKEN", "Channel slug already taken in this community.");
  }
  const now = deps.clock.now().toISOString();
  const record = await deps.channels.create({
    id: deps.ids.next(),
    ownerType: "community",
    ownerId: input.ownerId,
    slug: input.slug,
    name: input.name,
    description: input.description ?? "",
    visibility: input.visibility ?? "public",
    status: "active",
    createdAt: now,
    updatedAt: now,
  });
  await deps.leads.upsert({
    channelId: record.id,
    userId: input.initialLeadUserId,
    role: "lead",
    permissions: normalizeLeadPermissions(undefined),
    status: "active",
    assignedByUserId: input.initialLeadAssignedByUserId,
    assignedAt: now,
  });
  return { ok: true, value: toChannelPublicDTO(record, 0, 1) };
}

async function updateChannelProfile(deps: Deps, input: UpdateChannelProfileInput): Promise<ChannelsResult<ChannelPublicDTO>> {
  const cur = await deps.channels.getById(input.channelId);
  if (!cur) return fail("NOT_FOUND", "Channel not found.");
  await deps.channels.update(input.channelId, {
    name: input.name?.trim(),
    description: input.description?.trim(),
    visibility: input.visibility,
    updatedAt: deps.clock.now().toISOString(),
  });
  const s = await channelSummary(deps, input.channelId);
  return s ? { ok: true, value: s } : fail("NOT_FOUND", "Channel not found.");
}

async function archiveChannel(deps: Deps, channelId: string): Promise<ChannelsResult<ChannelPublicDTO>> {
  const cur = await deps.channels.getById(channelId);
  if (!cur) return fail("NOT_FOUND", "Channel not found.");
  await deps.channels.archive(channelId, deps.clock.now().toISOString());
  const s = await channelSummary(deps, channelId);
  return s ? { ok: true, value: s } : fail("NOT_FOUND", "Channel not found.");
}

async function assignChannelLead(deps: Deps, input: AssignChannelLeadInput): Promise<ChannelsResult<ChannelLeadDTO>> {
  if (!(await deps.channels.getById(input.channelId))) return fail("NOT_FOUND", "Channel not found.");
  if (!isValidLeadRole(input.role)) return fail("INVALID_LEAD_ROLE", "Unknown lead role.");
  const existing = await deps.leads.findActive(input.channelId, input.targetUserId);
  if (!existing) {
    const count = await deps.leads.countActiveForChannel(input.channelId);
    if (!canAddMoreLeads(count)) {
      return fail("LEAD_LIMIT_REACHED", `Channel reached the maximum of ${MAX_ACTIVE_LEADS} active leads.`);
    }
  }
  const now = deps.clock.now().toISOString();
  const { record } = await deps.leads.upsert({
    channelId: input.channelId,
    userId: input.targetUserId,
    role: input.role,
    permissions: normalizeLeadPermissions(input.permissions),
    status: "active",
    assignedByUserId: input.assignedByUserId,
    assignedAt: now,
  });
  return { ok: true, value: toChannelLeadDTO(record) };
}

async function revokeChannelLead(deps: Deps, input: RevokeChannelLeadInput): Promise<ChannelsResult<{ revoked: boolean }>> {
  if (!(await deps.channels.getById(input.channelId))) return fail("NOT_FOUND", "Channel not found.");
  const target = await deps.leads.findActive(input.channelId, input.targetUserId);
  if (!target) return fail("LEAD_NOT_FOUND", "User is not an active lead of this channel.");
  const count = await deps.leads.countActiveForChannel(input.channelId);
  if (!canRemoveLead(count)) {
    return fail("CANNOT_REMOVE_LAST_LEAD", `Channel must have at least ${MIN_ACTIVE_LEADS} active lead.`);
  }
  const ok = await deps.leads.revoke(input.channelId, input.targetUserId, deps.clock.now().toISOString());
  return { ok: true, value: { revoked: ok } };
}

async function updateChannelLeadPermissions(deps: Deps, input: UpdateChannelLeadPermissionsInput): Promise<ChannelsResult<ChannelLeadDTO>> {
  if (!(await deps.channels.getById(input.channelId))) return fail("NOT_FOUND", "Channel not found.");
  const updated = await deps.leads.updatePermissions(input.channelId, input.targetUserId, normalizeLeadPermissions(input.permissions));
  if (!updated) return fail("LEAD_NOT_FOUND", "User is not an active lead of this channel.");
  return { ok: true, value: toChannelLeadDTO(updated) };
}

async function listChannelLeads(deps: Deps, channelId: string): Promise<ChannelsResult<ChannelLeadDTO[]>> {
  if (!(await deps.channels.getById(channelId))) return fail("NOT_FOUND", "Channel not found.");
  const leads = await deps.leads.listActiveForChannel(channelId); // stable order: assignedAt asc + userId tie-breaker
  return { ok: true, value: leads.map(toChannelLeadDTO) };
}

export function createChannelsService(deps: Deps): ChannelsService {
  return {
    createChannelForCommunity: (input) => createChannelForCommunity(deps, input),
    updateChannelProfile: (input) => updateChannelProfile(deps, input),
    archiveChannel: (id) => archiveChannel(deps, id),
    assignChannelLead: (input) => assignChannelLead(deps, input),
    revokeChannelLead: (input) => revokeChannelLead(deps, input),
    updateChannelLeadPermissions: (input) => updateChannelLeadPermissions(deps, input),
    listChannelLeads: (id) => listChannelLeads(deps, id),
    followChannel: (channelId, followerUserId) => setFollow(deps, channelId, followerUserId, true),
    unfollowChannel: (channelId, followerUserId) => setFollow(deps, channelId, followerUserId, false),
    getPublicSummary: (id) => channelSummary(deps, id),
    async listForCommunity(communityId, cursor, limit) {
      const safe = Math.min(limit && limit > 0 ? limit : DEFAULT_LIMIT, MAX_LIMIT);
      const records = await deps.channels.listForOwner(communityId, cursor ?? null, safe); // SCALABILITY_HOT_PATH_EXCEPTION: scoped by ownerId, stable id order
      const items = await pageToPublic(deps, records);
      return { items, nextCursor: records.length === safe ? records[records.length - 1].id : null };
    },
    async listAllActive(cursor, limit) {
      const safe = Math.min(limit && limit > 0 ? limit : DEFAULT_LIMIT, MAX_LIMIT);
      const records = await deps.channels.listAllActive(cursor ?? null, safe); // SCALABILITY_HOT_PATH_EXCEPTION: stable id order; DB cursor later
      const items = await pageToPublic(deps, records);
      return { items, nextCursor: records.length === safe ? records[records.length - 1].id : null };
    },
    async listFollowedByUser(userId) {
      const follows = await deps.follows.listActiveForUser(userId);
      return listSummariesByRefs(deps, follows);
    },
    async listLedByUser(userId) {
      const leads = await deps.leads.listChannelsLedByUser(userId);
      return listSummariesByRefs(deps, leads);
    },
    async isUserActiveLead(channelId, userId) {
      const lead = await deps.leads.findActive(channelId, userId);
      return lead !== null;
    },
  };
}
