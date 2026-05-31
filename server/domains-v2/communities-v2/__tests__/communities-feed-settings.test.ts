import { describe, expect, it } from "vitest";
import { createCommunitiesService } from "../service";
import {
  createInMemoryCommunityRepository,
  createInMemoryFeedSettingsRepository,
  createInMemoryInviteRepository,
  createInMemoryJoinRequestRepository,
  createInMemoryMembershipRepository,
} from "../store";
import { createCommunityFeedSettingsService } from "../service-feeds";
import {
  canPostToCommunityAll,
  canPostStaffOnly,
  canPublishToDescendants,
  canViewStaffOnly,
} from "../policy-feeds";

const FOUNDER = "u-founder";
const ADMIN = "u-admin";
const MEMBER = "u-member";

async function setup() {
  const communities = createInMemoryCommunityRepository();
  const members = createInMemoryMembershipRepository();
  const joinRequests = createInMemoryJoinRequestRepository();
  const invites = createInMemoryInviteRepository();
  const feedSettings = createInMemoryFeedSettingsRepository();
  const clock = { now: () => new Date("2026-05-29T10:00:00.000Z") };
  let seq = 0;
  const ids = { next: () => `c-${++seq}` };
  const svc = createCommunitiesService({ communities, members, joinRequests, invites, clock, ids });
  const feeds = createCommunityFeedSettingsService({ communities, members, feedSettings, clock });
  const created = await svc.createCommunity({ founderUserId: FOUNDER, name: "Acme", slug: "acme", visibility: "public" });
  if (!created.ok) throw new Error("setup");
  const communityId = created.value.id;
  await members.add({ communityId, userId: ADMIN, role: "admin", status: "active", joinedAt: "2026-05-29T10:00:00.000Z" });
  await members.add({ communityId, userId: MEMBER, role: "member", status: "active", joinedAt: "2026-05-29T10:00:00.000Z" });
  return { feeds, communityId };
}

describe("communities-v2 feed settings", () => {
  it("returns defaults for a fresh community", async () => {
    const { feeds, communityId } = await setup();
    const res = await feeds.getCommunityFeedSettings(communityId);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.communityAllEnabled).toBe(true);
    expect(res.value.communityAllPostingPolicy).toBe("all_members");
    expect(res.value.relationalEnabled).toBe(false);
    expect(res.value.relationalMonthlyLimit).toBe(3);
    expect(res.value.descendantPublishingAllowedRoles).toEqual(["founder", "admin"]);
  });

  it("lets founder update settings", async () => {
    const { feeds, communityId } = await setup();
    const res = await feeds.updateCommunityFeedSettings({
      actorUserId: FOUNDER, communityId, communityAllPostingPolicy: "staff_only", relationalEnabled: true, relationalMonthlyLimit: 5,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.communityAllPostingPolicy).toBe("staff_only");
    expect(res.value.relationalEnabled).toBe(true);
    expect(res.value.relationalMonthlyLimit).toBe(5);
  });

  it("denies a member updating settings", async () => {
    const { feeds, communityId } = await setup();
    const res = await feeds.updateCommunityFeedSettings({ actorUserId: MEMBER, communityId, relationalEnabled: true });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("FORBIDDEN");
  });

  it("rejects an out-of-range relational limit", async () => {
    const { feeds, communityId } = await setup();
    const res = await feeds.updateCommunityFeedSettings({ actorUserId: FOUNDER, communityId, relationalMonthlyLimit: 99 });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("INVALID_RELATIONAL_LIMIT");
  });

  it("settings DTO carries no PII", async () => {
    const { feeds, communityId } = await setup();
    const res = await feeds.getCommunityFeedSettings(communityId);
    if (!res.ok) return;
    expect(JSON.stringify(res.value)).not.toMatch(/email|phone|@/i);
  });
});

describe("communities-v2 feed policy", () => {
  const settings = {
    communityId: "c1", communityAllEnabled: true, communityAllPostingPolicy: "all_members" as const,
    relationalEnabled: true, relationalMonthlyLimit: 3, staffOnlyEnabled: true,
    descendantPublishingEnabled: true, descendantPublishingAllowedRoles: ["founder", "admin"] as const, updatedAt: "x",
  };

  it("all_members policy lets a member post to community_all", () => {
    expect(canPostToCommunityAll("member", settings)).toBe(true);
  });
  it("staff_only posting policy blocks a member", () => {
    expect(canPostToCommunityAll("member", { ...settings, communityAllPostingPolicy: "staff_only" })).toBe(false);
    expect(canPostToCommunityAll("moderator", { ...settings, communityAllPostingPolicy: "staff_only" })).toBe(true);
  });
  it("staff_only feed visible to staff only", () => {
    expect(canViewStaffOnly("member", settings)).toBe(false);
    expect(canViewStaffOnly("moderator", settings)).toBe(true);
  });
  it("member cannot post staff_only", () => {
    expect(canPostStaffOnly("member", settings)).toBe(false);
    expect(canPostStaffOnly("admin", settings)).toBe(true);
  });
  it("relational propagation to descendants is denied", () => {
    expect(canPublishToDescendants("founder", settings, "relational")).toBe(false);
    expect(canPublishToDescendants("founder", settings, "community_all")).toBe(true);
  });
  it("moderator cannot publish to descendants unless allowed", () => {
    expect(canPublishToDescendants("moderator", settings, "community_all")).toBe(false);
    expect(canPublishToDescendants("moderator", { ...settings, descendantPublishingAllowedRoles: ["founder", "admin", "moderator"] }, "community_all")).toBe(true);
  });
});
