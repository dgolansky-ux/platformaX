/**
 * channels — service. A channel is owned by a community; follows are a
 * separate relation from community membership. This service does NOT check
 * community authority — the application use-case does that via the communities
 * public-api before calling createChannel (no cross-domain internals here).
 */
import type {
  ChannelFollowDTO,
  ChannelPublicDTO,
  CreateChannelInput,
} from "./dto";
import type { ChannelRepository, FollowRepository } from "./ports";
import { hasCommunityOwner, isValidChannelSlug } from "./policy";
import { toChannelPublicDTO } from "./mapper";

export type ChannelsClock = { now: () => Date };
export type ChannelsIdGenerator = { next: () => string };
export type ChannelsServiceDeps = {
  channels: ChannelRepository;
  follows: FollowRepository;
  clock: ChannelsClock;
  ids: ChannelsIdGenerator;
};

export type ChannelsErrorCode = "INVALID_SLUG" | "SLUG_TAKEN" | "MISSING_OWNER" | "NOT_FOUND";
export type ChannelsResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ChannelsErrorCode; message: string } };

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export interface ChannelsService {
  createChannelForCommunity(input: CreateChannelInput): Promise<ChannelsResult<ChannelPublicDTO>>;
  followChannel(channelId: string, followerUserId: string): Promise<ChannelsResult<ChannelFollowDTO>>;
  unfollowChannel(channelId: string, followerUserId: string): Promise<ChannelsResult<ChannelFollowDTO>>;
  getPublicSummary(channelId: string): Promise<ChannelPublicDTO | null>;
  listForCommunity(communityId: string, cursor: string | null, limit?: number): Promise<{ items: ChannelPublicDTO[]; nextCursor: string | null }>;
}

type Deps = ChannelsServiceDeps;

async function setFollow(deps: Deps, channelId: string, followerUserId: string, active: boolean): Promise<ChannelsResult<ChannelFollowDTO>> {
  if (!(await deps.channels.getById(channelId))) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Channel not found." } };
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

export function createChannelsService(deps: Deps): ChannelsService {
  return {
    async createChannelForCommunity(input) {
      if (!hasCommunityOwner(input.ownerType, input.ownerId)) {
        return { ok: false, error: { code: "MISSING_OWNER", message: "A channel must be owned by a community." } };
      }
      if (!isValidChannelSlug(input.slug)) {
        return { ok: false, error: { code: "INVALID_SLUG", message: "Invalid channel slug." } };
      }
      if (await deps.channels.findByOwnerSlug(input.ownerId, input.slug)) {
        return { ok: false, error: { code: "SLUG_TAKEN", message: "Channel slug already taken in this community." } };
      }
      const now = deps.clock.now().toISOString();
      const record = await deps.channels.create({
        id: deps.ids.next(), ownerType: "community", ownerId: input.ownerId, slug: input.slug,
        name: input.name, description: input.description ?? "", visibility: input.visibility ?? "public",
        status: "active", createdAt: now, updatedAt: now,
      });
      return { ok: true, value: toChannelPublicDTO(record, 0) };
    },
    followChannel: (channelId, followerUserId) => setFollow(deps, channelId, followerUserId, true),
    unfollowChannel: (channelId, followerUserId) => setFollow(deps, channelId, followerUserId, false),
    async getPublicSummary(channelId) {
      const c = await deps.channels.getById(channelId);
      return c ? toChannelPublicDTO(c, await deps.follows.countActive(channelId)) : null;
    },
    async listForCommunity(communityId, cursor, limit) {
      const safe = Math.min(limit && limit > 0 ? limit : DEFAULT_LIMIT, MAX_LIMIT);
      // Stable order by id (repository sorts ascending by id); cursor = last id. // SCALABILITY_HOT_PATH_EXCEPTION: in-memory foundation, DB cursor later
      const records = await deps.channels.listForOwner(communityId, cursor ?? null, safe); // SCALABILITY_HOT_PATH_EXCEPTION: stable order by id
      const items = await Promise.all(records.map(async (r) => toChannelPublicDTO(r, await deps.follows.countActive(r.id))));
      const nextCursor = records.length === safe ? records[records.length - 1].id : null;
      return { items, nextCursor };
    },
  };
}
