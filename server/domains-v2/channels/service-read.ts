import type { ChannelPublicDTO } from "./dto";
import type { ChannelLeadRepository, ChannelRecord, ChannelRepository, FollowRepository } from "./ports";
import { toChannelPublicDTO } from "./mapper";

const MAX_LIMIT = 50;

export type ChannelsReadDeps = {
  channels: ChannelRepository;
  leads: ChannelLeadRepository;
  follows: FollowRepository;
};

export async function channelSummary(
  deps: ChannelsReadDeps,
  channelId: string,
): Promise<ChannelPublicDTO | null> {
  const c = await deps.channels.getById(channelId);
  if (!c) return null;
  const followerCount = await deps.follows.countActive(channelId);
  const leadCount = await deps.leads.countActiveForChannel(channelId);
  return toChannelPublicDTO(c, followerCount, leadCount);
}

export async function pageToPublic(
  deps: ChannelsReadDeps,
  records: readonly ChannelRecord[],
): Promise<ChannelPublicDTO[]> {
  return Promise.all(records.slice(0, MAX_LIMIT).map(async (r) =>
    toChannelPublicDTO(
      r,
      await deps.follows.countActive(r.id),
      await deps.leads.countActiveForChannel(r.id),
    )
  ));
}

export async function listSummariesByRefs(
  deps: ChannelsReadDeps,
  refs: readonly { channelId: string }[],
): Promise<ChannelPublicDTO[]> {
  const out: ChannelPublicDTO[] = [];
  for (const ref of refs.slice(0, MAX_LIMIT)) {
    const s = await channelSummary(deps, ref.channelId);
    if (s) out.push(s);
  }
  return out;
}
