import { describe, expect, it } from "vitest";
import {
  createCommunitiesService,
  createCommunityFeedSettingsService,
  createCommunityStructureService,
  createInMemoryCommunityRepository,
  createInMemoryFeedSettingsRepository,
  createInMemoryHierarchyRepository,
  createInMemoryInviteRepository,
  createInMemoryJoinRequestRepository,
  createInMemoryMembershipRepository,
} from "@server/domains-v2/communities-v2/public-api";
import {
  createCommunityFeedService,
  createInMemoryCommunityFeedItemRepository,
  createInMemoryCommunityPostRepository,
} from "@server/domains-v2/content-v2/public-api";
import { createCommunityFeedsUseCase } from "../service";

const FOUNDER = "u-founder";
const ADMIN = "u-admin";
const MOD = "u-mod";
const MEMBER = "u-member";

async function setup() {
  const communities = createInMemoryCommunityRepository();
  const members = createInMemoryMembershipRepository();
  const joinRequests = createInMemoryJoinRequestRepository();
  const invites = createInMemoryInviteRepository();
  const hierarchy = createInMemoryHierarchyRepository();
  const feedSettingsRepo = createInMemoryFeedSettingsRepository();
  const posts = createInMemoryCommunityPostRepository();
  const items = createInMemoryCommunityFeedItemRepository();
  let seq = 0;
  const clock = { now: () => new Date("2026-05-29T10:00:00.000Z") };
  const ids = { next: () => `id-${++seq}` };

  const communitiesService = createCommunitiesService({ communities, members, joinRequests, invites, clock, ids });
  const feedSettings = createCommunityFeedSettingsService({ communities, members, feedSettings: feedSettingsRepo, clock });
  const structure = createCommunityStructureService({ communities, members, hierarchy, clock, ids });
  const content = createCommunityFeedService({ posts, items, clock, ids });
  const useCase = createCommunityFeedsUseCase({ communities: communitiesService, feedSettings, structure, content, clock, ids });

  const root = await communitiesService.createCommunity({ founderUserId: FOUNDER, name: "Acme", slug: "acme", visibility: "public" });
  if (!root.ok) throw new Error("root");
  const rootId = root.value.id;
  await members.add({ communityId: rootId, userId: ADMIN, role: "admin", status: "active", joinedAt: "2026-05-29T10:00:00.000Z" });
  await members.add({ communityId: rootId, userId: MOD, role: "moderator", status: "active", joinedAt: "2026-05-29T10:00:00.000Z" });
  await members.add({ communityId: rootId, userId: MEMBER, role: "member", status: "active", joinedAt: "2026-05-29T10:00:00.000Z" });

  const c1 = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "Child 1", slug: "child-1" });
  const c2 = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "Child 2", slug: "child-2" });
  if (!c1.ok || !c2.ok) throw new Error("children");
  const gc = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: c1.value.id, name: "Grand", slug: "grand" });
  if (!gc.ok) throw new Error("grand");

  return { useCase, feedSettings, communitiesService, rootId, c1Id: c1.value.id, c2Id: c2.value.id, gcId: gc.value.id };
}

describe("community-feeds use-case — posting policy", () => {
  it("member can post community_all when policy is all_members", async () => {
    const { useCase, rootId } = await setup();
    const res = await useCase.publishCommunityPost({ actorUserId: MEMBER, communityId: rootId, feedType: "community_all", body: "Hi", scope: "current_community_only" });
    expect(res.ok).toBe(true);
  });

  it("member denied community_all when policy is staff_only", async () => {
    const { useCase, feedSettings, rootId } = await setup();
    await feedSettings.updateCommunityFeedSettings({ actorUserId: FOUNDER, communityId: rootId, communityAllPostingPolicy: "staff_only" });
    const res = await useCase.publishCommunityPost({ actorUserId: MEMBER, communityId: rootId, feedType: "community_all", body: "Hi", scope: "current_community_only" });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("FORBIDDEN");
  });

  it("staff can post staff_only, member cannot", async () => {
    const { useCase, rootId } = await setup();
    const mod = await useCase.publishCommunityPost({ actorUserId: MOD, communityId: rootId, feedType: "staff_only", body: "Staff", scope: "current_community_only" });
    expect(mod.ok).toBe(true);
    const member = await useCase.publishCommunityPost({ actorUserId: MEMBER, communityId: rootId, feedType: "staff_only", body: "Nope", scope: "current_community_only" });
    expect(member.ok).toBe(false);
    if (member.ok) return;
    expect(member.error.code).toBe("FORBIDDEN");
  });
});

describe("community-feeds use-case — relational quota", () => {
  it("enforces the monthly quota backend-side", async () => {
    const { useCase, feedSettings, rootId } = await setup();
    await feedSettings.updateCommunityFeedSettings({ actorUserId: FOUNDER, communityId: rootId, relationalEnabled: true, relationalMonthlyLimit: 2 });
    const a = await useCase.publishCommunityPost({ actorUserId: MEMBER, communityId: rootId, feedType: "relational", body: "R1", scope: "current_community_only" });
    const b = await useCase.publishCommunityPost({ actorUserId: MEMBER, communityId: rootId, feedType: "relational", body: "R2", scope: "current_community_only" });
    const c = await useCase.publishCommunityPost({ actorUserId: MEMBER, communityId: rootId, feedType: "relational", body: "R3", scope: "current_community_only" });
    expect(a.ok && b.ok).toBe(true);
    expect(c.ok).toBe(false);
    if (c.ok) return;
    expect(c.error.code).toBe("QUOTA_EXCEEDED");
  });

  it("denies relational when disabled", async () => {
    const { useCase, rootId } = await setup();
    const res = await useCase.publishCommunityPost({ actorUserId: MEMBER, communityId: rootId, feedType: "relational", body: "R", scope: "current_community_only" });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("FEED_DISABLED");
  });

  it("denies relational propagation down the structure", async () => {
    const { useCase, feedSettings, rootId } = await setup();
    await feedSettings.updateCommunityFeedSettings({ actorUserId: FOUNDER, communityId: rootId, relationalEnabled: true });
    const res = await useCase.publishCommunityPost({ actorUserId: FOUNDER, communityId: rootId, feedType: "relational", body: "R", scope: "direct_children" });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("RELATIONAL_NO_PROPAGATION");
  });
});

describe("community-feeds use-case — descendant publishing", () => {
  it("founder publishes community_all to direct children", async () => {
    const { useCase, rootId, c1Id, c2Id, gcId } = await setup();
    const res = await useCase.publishCommunityPost({ actorUserId: FOUNDER, communityId: rootId, feedType: "community_all", body: "Down", scope: "direct_children" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.distributedCount).toBe(2);
    expect([...res.value.targetCommunityIds].sort()).toEqual([c1Id, c2Id].sort());
    // grandchild NOT reached by direct_children
    const gcFeed = await useCase.listCommunityFeed(FOUNDER, gcId, "community_all");
    expect(gcFeed.ok && gcFeed.value.items).toHaveLength(0);
    // child feed has the distributed item with trace
    const c1Feed = await useCase.listCommunityFeed(FOUNDER, c1Id, "community_all");
    if (!c1Feed.ok) return;
    expect(c1Feed.value.items).toHaveLength(1);
    expect(c1Feed.value.items[0].isDistributed).toBe(true);
    expect(c1Feed.value.items[0].sourceCommunityId).toBe(rootId);
  });

  it("publishes to all descendants", async () => {
    const { useCase, rootId } = await setup();
    const res = await useCase.publishCommunityPost({ actorUserId: FOUNDER, communityId: rootId, feedType: "community_all", body: "All", scope: "all_descendants" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.distributedCount).toBe(3); // c1, c2, grand
  });

  it("publishes to selected descendants only", async () => {
    const { useCase, rootId, c2Id } = await setup();
    const res = await useCase.publishCommunityPost({ actorUserId: FOUNDER, communityId: rootId, feedType: "community_all", body: "Sel", scope: "selected_descendants", selectedDescendantCommunityIds: [c2Id] });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.targetCommunityIds).toEqual([c2Id]);
  });

  it("rejects a non-descendant target", async () => {
    const { useCase, rootId } = await setup();
    const res = await useCase.publishCommunityPost({ actorUserId: FOUNDER, communityId: rootId, feedType: "community_all", body: "X", scope: "selected_descendants", selectedDescendantCommunityIds: ["not-a-descendant"] });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("TARGET_NOT_DESCENDANT");
  });

  it("denies a moderator without descendant permission", async () => {
    const { useCase, rootId } = await setup();
    const res = await useCase.publishCommunityPost({ actorUserId: MOD, communityId: rootId, feedType: "community_all", body: "X", scope: "direct_children" });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("FORBIDDEN");
  });
});

describe("community-feeds use-case — visibility", () => {
  it("staff_only feed is not viewable by a plain member", async () => {
    const { useCase, rootId } = await setup();
    await useCase.publishCommunityPost({ actorUserId: FOUNDER, communityId: rootId, feedType: "staff_only", body: "Secret", scope: "current_community_only" });
    const staff = await useCase.listCommunityFeed(FOUNDER, rootId, "staff_only");
    expect(staff.ok && staff.value.items).toHaveLength(1);
    const member = await useCase.listCommunityFeed(MEMBER, rootId, "staff_only");
    expect(member.ok).toBe(false);
    if (member.ok) return;
    expect(member.error.code).toBe("FORBIDDEN");
  });

  it("feed tabs state reflects role + settings", async () => {
    const { useCase, feedSettings, rootId } = await setup();
    await feedSettings.updateCommunityFeedSettings({ actorUserId: FOUNDER, communityId: rootId, relationalEnabled: true, relationalMonthlyLimit: 4 });
    const member = await useCase.getCommunityFeedTabsState(MEMBER, rootId);
    if (!member.ok) return;
    expect(member.value.communityAll.visible).toBe(true);
    expect(member.value.staffOnly.visible).toBe(false);
    expect(member.value.relational.visible).toBe(true);
    expect(member.value.relational.remaining).toBe(4);
    expect(member.value.canPublishToDescendants).toBe(false);
    const founder = await useCase.getCommunityFeedTabsState(FOUNDER, rootId);
    if (!founder.ok) return;
    expect(founder.value.staffOnly.visible).toBe(true);
    expect(founder.value.canPublishToDescendants).toBe(true);
  });

  it("feed DTO carries no PII", async () => {
    const { useCase, rootId } = await setup();
    await useCase.publishCommunityPost({ actorUserId: FOUNDER, communityId: rootId, feedType: "community_all", body: "Hi", scope: "current_community_only" });
    const feed = await useCase.listCommunityFeed(FOUNDER, rootId, "community_all");
    if (!feed.ok) return;
    expect(JSON.stringify(feed.value)).not.toMatch(/email|phone|@/i);
  });
});
