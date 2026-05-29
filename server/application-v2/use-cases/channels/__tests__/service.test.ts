import { describe, expect, it } from "vitest";
import { createChannelsUseCase } from "../public-api";
import {
  createCommunitiesService,
  createInMemoryCommunityRepository,
  createInMemoryInviteRepository,
  createInMemoryJoinRequestRepository,
  createInMemoryMembershipRepository,
} from "@server/domains-v2/communities-v2/public-api";
import {
  createChannelsService,
  createInMemoryChannelLeadRepository,
  createInMemoryChannelRepository,
  createInMemoryFollowRepository,
} from "@server/domains-v2/channels/public-api";

const FOUNDER = "u-founder";
const ADMIN = "u-admin";
const MEMBER = "u-member";
const STRANGER = "u-stranger";

async function makeFixture() {
  let seq = 0;
  const clock = { now: () => new Date("2026-05-29T00:00:00Z") };
  const ids = { next: () => `id-${++seq}` };
  const communities = createCommunitiesService({
    communities: createInMemoryCommunityRepository(),
    members: createInMemoryMembershipRepository(),
    joinRequests: createInMemoryJoinRequestRepository(),
    invites: createInMemoryInviteRepository(),
    clock,
    ids,
  });
  const channels = createChannelsService({
    channels: createInMemoryChannelRepository(),
    leads: createInMemoryChannelLeadRepository(),
    follows: createInMemoryFollowRepository(),
    clock,
    ids,
  });
  const created = await communities.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
  if (!created.ok) throw new Error("setup");
  const communityId = created.value.id;
  // ADMIN + MEMBER are existing community members so we can assign leads etc.
  await communities.joinCommunity(communityId, ADMIN);
  await communities.changeMemberRole({ actorUserId: FOUNDER, communityId, targetUserId: ADMIN, nextRole: "admin" });
  await communities.joinCommunity(communityId, MEMBER);
  const usecase = createChannelsUseCase({ authority: communities, channels });
  return { usecase, channels, communityId };
}

describe("channels use-case — createCommunityChannel", () => {
  it("lets a founder create a channel and seats the initial lead", async () => {
    const { usecase, channels, communityId } = await makeFixture();
    const res = await usecase.createCommunityChannel({ actorUserId: FOUNDER, communityId, slug: "general", name: "General" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.leadCount).toBe(1);
    expect(await channels.isUserActiveLead(res.value.id, FOUNDER)).toBe(true);
  });

  it("rejects a non-manager with FORBIDDEN", async () => {
    const { usecase, communityId } = await makeFixture();
    const res = await usecase.createCommunityChannel({ actorUserId: STRANGER, communityId, slug: "x", name: "X" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("rejects an initial lead who is not a community member", async () => {
    const { usecase, communityId } = await makeFixture();
    const res = await usecase.createCommunityChannel({
      actorUserId: FOUNDER, communityId, slug: "g", name: "G", initialLeadUserId: STRANGER,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("MEMBERSHIP_REQUIRED");
  });
});

describe("channels use-case — assignCommunityChannelLead", () => {
  it("admin can assign a member as co_lead", async () => {
    const { usecase, communityId } = await makeFixture();
    const ch = await usecase.createCommunityChannel({ actorUserId: FOUNDER, communityId, slug: "g", name: "G" });
    if (!ch.ok) throw new Error("setup");
    const res = await usecase.assignCommunityChannelLead({
      actorUserId: ADMIN, channelId: ch.value.id, targetUserId: MEMBER, role: "co_lead",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.role).toBe("co_lead");
  });

  it("blocks assigning a non-member", async () => {
    const { usecase, communityId } = await makeFixture();
    const ch = await usecase.createCommunityChannel({ actorUserId: FOUNDER, communityId, slug: "g", name: "G" });
    if (!ch.ok) throw new Error("setup");
    const res = await usecase.assignCommunityChannelLead({
      actorUserId: FOUNDER, channelId: ch.value.id, targetUserId: STRANGER, role: "co_lead",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("MEMBERSHIP_REQUIRED");
  });

  it("blocks a stranger from assigning leads", async () => {
    const { usecase, communityId } = await makeFixture();
    const ch = await usecase.createCommunityChannel({ actorUserId: FOUNDER, communityId, slug: "g", name: "G" });
    if (!ch.ok) throw new Error("setup");
    const res = await usecase.assignCommunityChannelLead({
      actorUserId: STRANGER, channelId: ch.value.id, targetUserId: MEMBER, role: "co_lead",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });
});

describe("channels use-case — directory + profile views", () => {
  it("directory composes followed/myCommunity/leading/discover sections", async () => {
    const { usecase, communityId } = await makeFixture();
    const a = await usecase.createCommunityChannel({ actorUserId: FOUNDER, communityId, slug: "a", name: "A" });
    const b = await usecase.createCommunityChannel({ actorUserId: FOUNDER, communityId, slug: "b", name: "B" });
    if (!a.ok || !b.ok) throw new Error("setup");
    // MEMBER follows channel A but does not lead anything
    await usecase.followChannel({ actorUserId: MEMBER, channelId: a.value.id });
    const view = await usecase.getChannelsDirectoryView({
      actorUserId: MEMBER, myCommunityIds: [communityId],
    });
    expect(view.ok).toBe(true);
    if (!view.ok) return;
    expect(view.value.followed.map((c) => c.channel.id)).toEqual([a.value.id]);
    expect(view.value.myCommunityChannels.map((c) => c.channel.id).sort()).toEqual([a.value.id, b.value.id].sort());
    expect(view.value.leading.length).toBe(0);
    // discover excludes channels the user already saw (followed/myCommunity)
    expect(view.value.discover.length).toBe(0);
  });

  it("channel profile view exposes viewer permissions, no PII", async () => {
    const { usecase, communityId } = await makeFixture();
    const ch = await usecase.createCommunityChannel({ actorUserId: FOUNDER, communityId, slug: "g", name: "G" });
    if (!ch.ok) throw new Error("setup");
    const founderView = await usecase.getChannelProfileView(ch.value.id, FOUNDER);
    if (!founderView.ok) return;
    expect(founderView.value.viewer.isLead).toBe(true);
    expect(founderView.value.viewer.canManageChannel).toBe(true);
    expect(founderView.value.viewer.canManageLeads).toBe(true);
    expect(JSON.stringify(founderView.value)).not.toMatch(/email|phone|@/i);

    const memberView = await usecase.getChannelProfileView(ch.value.id, MEMBER);
    if (!memberView.ok) return;
    expect(memberView.value.viewer.isLead).toBe(false);
    expect(memberView.value.viewer.canManageChannel).toBe(false);
    // canManageChannel via community authority: MEMBER is not founder/admin.
    expect(memberView.value.viewer.canFollow).toBe(true);
  });
});

describe("channels use-case — follow != membership", () => {
  it("a non-member (stranger) can follow a public channel without joining the community", async () => {
    const { usecase, communityId, channels } = await makeFixture();
    const ch = await usecase.createCommunityChannel({ actorUserId: FOUNDER, communityId, slug: "g", name: "G" });
    if (!ch.ok) throw new Error("setup");
    const res = await usecase.followChannel({ actorUserId: STRANGER, channelId: ch.value.id });
    expect(res.ok).toBe(true);
    const summary = await channels.getPublicSummary(ch.value.id);
    expect(summary?.followerCount).toBe(1);
  });

  it("being a member of the community does NOT auto-follow its channels", async () => {
    const { usecase, communityId, channels } = await makeFixture();
    const ch = await usecase.createCommunityChannel({ actorUserId: FOUNDER, communityId, slug: "g", name: "G" });
    if (!ch.ok) throw new Error("setup");
    // MEMBER joined the community in the fixture but did NOT call followChannel
    const summary = await channels.getPublicSummary(ch.value.id);
    expect(summary?.followerCount).toBe(0);
  });
});

describe("channels use-case — architecture", () => {
  it("orchestrator does not import internals of either domain", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const file = fs.readFileSync(path.resolve(__dirname, "../service.ts"), "utf-8");
    expect(file).not.toMatch(/from\s+["']@server\/domains-v2\/(communities-v2|channels)\/(?!public-api|contracts)/);
  });
});
