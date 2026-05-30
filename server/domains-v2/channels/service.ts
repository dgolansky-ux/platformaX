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
import type {
  ChannelInteractionSettingsDTO,
  UpdateChannelInteractionSettingsInput,
} from "./interaction-settings";
import { toChannelLeadDTO, toChannelPublicDTO } from "./mapper";
import { channelSummary, listSummariesByRefs, pageToPublic } from "./service-read";
import {
  assignChannelLead as assignLead,
  revokeChannelLead as revokeLead,
  updateChannelLeadPermissions as updateLeadPermissions,
} from "./service-leads";
import {
  getInteractionSettings as getChannelInteractionSettings,
  updateInteractionSettings as updateChannelInteractionSettings,
} from "./service-interactions";
import type {
  ChannelLeadRepository,
  ChannelRepository,
  ChannelInteractionSettingsRepository,
  FollowRepository,
} from "./ports";
import {
  hasCommunityOwner,
  isValidChannelSlug,
  normalizeLeadPermissions,
} from "./policy";

export type ChannelsClock = { now: () => Date };
export type ChannelsIdGenerator = { next: () => string };
export type ChannelsServiceDeps = {
  channels: ChannelRepository;
  leads: ChannelLeadRepository;
  follows: FollowRepository;
  interactionSettings?: ChannelInteractionSettingsRepository;
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
  | "MISSING_INITIAL_LEAD"
  | "SETTINGS_REPOSITORY_MISSING";

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
  getInteractionSettings(channelId: string): Promise<ChannelsResult<ChannelInteractionSettingsDTO>>;
  updateInteractionSettings(input: UpdateChannelInteractionSettingsInput): Promise<ChannelsResult<ChannelInteractionSettingsDTO>>;
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
    assignChannelLead: (input) => assignLead(deps, input),
    revokeChannelLead: (input) => revokeLead(deps, input),
    updateChannelLeadPermissions: (input) => updateLeadPermissions(deps, input),
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
    getInteractionSettings: (id) => getChannelInteractionSettings(deps, id),
    updateInteractionSettings: (input) => updateChannelInteractionSettings(deps, input),
  };
}
