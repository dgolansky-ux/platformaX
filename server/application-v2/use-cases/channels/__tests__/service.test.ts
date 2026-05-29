import { describe, expect, it } from "vitest";
import { createChannelsUseCase } from "../public-api";
import {
  createCommunitiesService,
  createInMemoryCommunityRepository,
  createInMemoryMembershipRepository,
  createInMemoryJoinRequestRepository,
} from "@server/domains-v2/communities-v2/public-api";
import {
  createChannelsService,
  createInMemoryChannelRepository,
  createInMemoryFollowRepository,
} from "@server/domains-v2/channels/public-api";

const FOUNDER = "u-founder";
const STRANGER = "u-stranger";

async function makeFixture() {
  let seq = 0;
  const communities = createCommunitiesService({
    communities: createInMemoryCommunityRepository(),
    members: createInMemoryMembershipRepository(),
    joinRequests: createInMemoryJoinRequestRepository(),
    clock: { now: () => new Date("2026-05-29T00:00:00Z") },
    ids: { next: () => `c-${++seq}` },
  });
  const channels = createChannelsService({
    channels: createInMemoryChannelRepository(),
    follows: createInMemoryFollowRepository(),
    clock: { now: () => new Date("2026-05-29T00:00:00Z") },
    ids: { next: () => `ch-${++seq}` },
  });
  const created = await communities.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
  if (!created.ok) throw new Error("setup");
  const usecase = createChannelsUseCase({ authority: communities, channels });
  return { usecase, communityId: created.value.id };
}

describe("channels use-case — createChannelForCommunity", () => {
  it("lets a community manager create a channel", async () => {
    const { usecase, communityId } = await makeFixture();
    const res = await usecase.createChannelForCommunity({ actorUserId: FOUNDER, communityId, slug: "general", name: "General" });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.ownerId).toBe(communityId);
  });

  it("rejects a non-manager with FORBIDDEN", async () => {
    const { usecase, communityId } = await makeFixture();
    const res = await usecase.createChannelForCommunity({ actorUserId: STRANGER, communityId, slug: "general", name: "General" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });
});
