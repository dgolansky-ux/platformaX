import { beforeEach, describe, expect, it } from "vitest";
import {
  canManageChannelContent,
  canCommentOnChannelPost,
  canModerateChannelComment,
  canPinChannelPost,
  canPublishChannelContent,
  canReactToChannelPost,
  canUpdateChannelInteractionSettings,
  canViewChannelFeed,
  createChannelsService,
  createInMemoryChannelInteractionSettingsRepository,
  createInMemoryChannelLeadRepository,
  createInMemoryChannelRepository,
  createInMemoryFollowRepository,
  type ChannelsService,
  type CreateChannelInput,
} from "../public-api";

const COMMUNITY = "comm-1";
const FOUNDER = "u-founder";

function makeService(): ChannelsService {
  let seq = 0;
  return createChannelsService({
    channels: createInMemoryChannelRepository(),
    leads: createInMemoryChannelLeadRepository(),
    follows: createInMemoryFollowRepository(),
    interactionSettings: createInMemoryChannelInteractionSettingsRepository(),
    clock: { now: () => new Date("2026-05-29T00:00:00Z") },
    ids: { next: () => `ch-${++seq}` },
  });
}

const base: CreateChannelInput = {
  ownerType: "community",
  ownerId: COMMUNITY,
  slug: "news",
  name: "News",
  initialLeadUserId: FOUNDER,
  initialLeadAssignedByUserId: FOUNDER,
};

describe("channels service", () => {
  let svc: ChannelsService;
  beforeEach(() => {
    svc = makeService();
  });

  it("requires a community owner", async () => {
    const res = await svc.createChannelForCommunity({ ...base, ownerId: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("MISSING_OWNER");
  });

  it("requires an initial lead", async () => {
    const res = await svc.createChannelForCommunity({ ...base, initialLeadUserId: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("MISSING_INITIAL_LEAD");
  });

  it("creates a channel with the initial lead active", async () => {
    const c = await svc.createChannelForCommunity(base);
    expect(c.ok).toBe(true);
    if (!c.ok) return;
    expect(c.value.leadCount).toBe(1);
    expect(await svc.isUserActiveLead(c.value.id, FOUNDER)).toBe(true);
  });

  it("blocks a duplicate slug within the community", async () => {
    const ok = await svc.createChannelForCommunity(base);
    expect(ok.ok).toBe(true);
    const dup = await svc.createChannelForCommunity(base);
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error.code).toBe("SLUG_TAKEN");
  });

  it("follow is independent of membership; idempotent follow; unfollow flips", async () => {
    const c = await svc.createChannelForCommunity(base);
    if (!c.ok) throw new Error("setup");
    await svc.followChannel(c.value.id, "u1");
    await svc.followChannel(c.value.id, "u1");
    let s = await svc.getPublicSummary(c.value.id);
    expect(s?.followerCount).toBe(1);
    await svc.unfollowChannel(c.value.id, "u1");
    s = await svc.getPublicSummary(c.value.id);
    expect(s?.followerCount).toBe(0);
  });

  it("public channel DTO carries no PII", async () => {
    const c = await svc.createChannelForCommunity(base);
    if (!c.ok) throw new Error("setup");
    const json = JSON.stringify(c.value);
    expect(json).not.toMatch(/email|phone|@/i);
    expect(c.value.ownerType).toBe("community");
  });

  it("listForCommunity paginates with a stable cursor", async () => {
    for (let i = 0; i < 3; i++) {
      await svc.createChannelForCommunity({ ...base, slug: `ch-${i}`, name: `C${i}` });
    }
    const page1 = await svc.listForCommunity(COMMUNITY, null, 2);
    expect(page1.items.length).toBe(2);
    expect(page1.nextCursor).not.toBeNull();
    const page2 = await svc.listForCommunity(COMMUNITY, page1.nextCursor, 2);
    expect(page2.items.length).toBe(1);
  });

  it("listAllActive lists across communities; archived hidden", async () => {
    const a = await svc.createChannelForCommunity(base);
    const b = await svc.createChannelForCommunity({ ...base, slug: "other", ownerId: "comm-2" });
    if (!a.ok || !b.ok) throw new Error("setup");
    await svc.archiveChannel(a.value.id);
    const dir = await svc.listAllActive(null);
    expect(dir.items.map((c) => c.id)).toEqual([b.value.id]);
  });

  it("assignChannelLead — adds co_lead and respects the max of 5", async () => {
    const c = await svc.createChannelForCommunity(base);
    if (!c.ok) throw new Error("setup");
    for (let i = 0; i < 4; i++) {
      const r = await svc.assignChannelLead({
        channelId: c.value.id, targetUserId: `u-${i}`, role: "co_lead", assignedByUserId: FOUNDER,
      });
      expect(r.ok).toBe(true);
    }
    const counted = await svc.getPublicSummary(c.value.id);
    expect(counted?.leadCount).toBe(5);
    const overflow = await svc.assignChannelLead({
      channelId: c.value.id, targetUserId: "u-X", role: "co_lead", assignedByUserId: FOUNDER,
    });
    expect(overflow.ok).toBe(false);
    if (!overflow.ok) expect(overflow.error.code).toBe("LEAD_LIMIT_REACHED");
  });

  it("re-assigning an existing active lead is idempotent (does not consume a slot)", async () => {
    const c = await svc.createChannelForCommunity(base);
    if (!c.ok) throw new Error("setup");
    await svc.assignChannelLead({ channelId: c.value.id, targetUserId: "u-1", role: "co_lead", assignedByUserId: FOUNDER });
    await svc.assignChannelLead({ channelId: c.value.id, targetUserId: "u-1", role: "co_lead", assignedByUserId: FOUNDER });
    const s = await svc.getPublicSummary(c.value.id);
    expect(s?.leadCount).toBe(2);
  });

  it("revokeChannelLead blocks the LAST active lead", async () => {
    const c = await svc.createChannelForCommunity(base);
    if (!c.ok) throw new Error("setup");
    const res = await svc.revokeChannelLead({ channelId: c.value.id, targetUserId: FOUNDER });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("CANNOT_REMOVE_LAST_LEAD");
  });

  it("revokeChannelLead removes a non-last active lead", async () => {
    const c = await svc.createChannelForCommunity(base);
    if (!c.ok) throw new Error("setup");
    await svc.assignChannelLead({ channelId: c.value.id, targetUserId: "u-1", role: "co_lead", assignedByUserId: FOUNDER });
    const res = await svc.revokeChannelLead({ channelId: c.value.id, targetUserId: "u-1" });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.revoked).toBe(true);
    expect(await svc.isUserActiveLead(c.value.id, "u-1")).toBe(false);
  });

  it("updateChannelLeadPermissions changes permissions of an active lead", async () => {
    const c = await svc.createChannelForCommunity(base);
    if (!c.ok) throw new Error("setup");
    const upd = await svc.updateChannelLeadPermissions({
      channelId: c.value.id, targetUserId: FOUNDER, permissions: ["manage_channel_profile"],
    });
    expect(upd.ok).toBe(true);
    if (upd.ok) expect(upd.value.permissions).toEqual(["manage_channel_profile"]);
  });

  it("channel content permissions are explicit and lead-scoped", async () => {
    expect(canPublishChannelContent(["publish_channel_content"])).toBe(true);
    expect(canPublishChannelContent(["manage_channel_profile"])).toBe(false);
    expect(canManageChannelContent(["manage_channel_content"])).toBe(true);
    expect(canPinChannelPost(["pin_channel_post"])).toBe(true);
    expect(canUpdateChannelInteractionSettings(["manage_channel_interactions"])).toBe(true);
    expect(canModerateChannelComment(["moderate_channel_comments"])).toBe(true);
    expect(canModerateChannelComment(["manage_channel_profile"])).toBe(false);
  });

  it("lead with manage permission can update interaction settings", async () => {
    const c = await svc.createChannelForCommunity(base);
    if (!c.ok) throw new Error("setup");
    const updated = await svc.updateInteractionSettings({
      channelId: c.value.id,
      commentsEnabled: false,
      reactionsEnabled: false,
      commentPolicy: "leads_only",
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.commentsEnabled).toBe(false);
    expect(updated.value.reactionsEnabled).toBe(false);
    expect(updated.value.commentPolicy).toBe("leads_only");
  });

  it("interaction policies gate comments and reactions", () => {
    const baseSettings = {
      channelId: "ch",
      commentsEnabled: true,
      reactionsEnabled: true,
      commentPolicy: "followers" as const,
      moderationPolicy: "lead_permission_required" as const,
      updatedAt: "2026-05-29T00:00:00Z",
    };
    expect(canCommentOnChannelPost({ settings: baseSettings, viewerFollows: true, viewerIsLead: false, viewerIsCommunityMember: false })).toBe(true);
    expect(canCommentOnChannelPost({ settings: { ...baseSettings, commentsEnabled: false }, viewerFollows: true, viewerIsLead: false, viewerIsCommunityMember: false })).toBe(false);
    expect(canCommentOnChannelPost({ settings: { ...baseSettings, commentPolicy: "community_members" }, viewerFollows: false, viewerIsLead: false, viewerIsCommunityMember: true })).toBe(true);
    expect(canCommentOnChannelPost({ settings: { ...baseSettings, commentPolicy: "community_members" }, viewerFollows: true, viewerIsLead: false, viewerIsCommunityMember: false })).toBe(false);
    expect(canCommentOnChannelPost({ settings: { ...baseSettings, commentPolicy: "leads_only" }, viewerFollows: true, viewerIsLead: false, viewerIsCommunityMember: true })).toBe(false);
    expect(canCommentOnChannelPost({ settings: { ...baseSettings, commentPolicy: "leads_only" }, viewerFollows: false, viewerIsLead: true, viewerIsCommunityMember: false })).toBe(true);
    expect(canReactToChannelPost({ settings: baseSettings })).toBe(true);
    expect(canReactToChannelPost({ settings: { ...baseSettings, reactionsEnabled: false } })).toBe(false);
  });

  it("private channel feed visibility is gated by channel state", async () => {
    expect(canViewChannelFeed({
      visibility: "public",
      viewerFollows: false,
      viewerIsLead: false,
      viewerIsCommunityManager: false,
    })).toBe(true);
    expect(canViewChannelFeed({
      visibility: "private",
      viewerFollows: false,
      viewerIsLead: false,
      viewerIsCommunityManager: false,
    })).toBe(false);
    expect(canViewChannelFeed({
      visibility: "private",
      viewerFollows: true,
      viewerIsLead: false,
      viewerIsCommunityManager: false,
    })).toBe(true);
  });

  it("listChannelLeads returns active leads only (no PII)", async () => {
    const c = await svc.createChannelForCommunity(base);
    if (!c.ok) throw new Error("setup");
    await svc.assignChannelLead({ channelId: c.value.id, targetUserId: "u-2", role: "co_lead", assignedByUserId: FOUNDER });
    await svc.assignChannelLead({ channelId: c.value.id, targetUserId: "u-3", role: "co_lead", assignedByUserId: FOUNDER });
    await svc.revokeChannelLead({ channelId: c.value.id, targetUserId: "u-3" });
    const list = await svc.listChannelLeads(c.value.id);
    expect(list.ok).toBe(true);
    if (!list.ok) return;
    expect(list.value.map((l) => l.userId).sort()).toEqual([FOUNDER, "u-2"].sort());
    expect(JSON.stringify(list.value)).not.toMatch(/email|phone|@/i);
  });

  it("listFollowedByUser returns only followed channels", async () => {
    const c = await svc.createChannelForCommunity(base);
    const other = await svc.createChannelForCommunity({ ...base, slug: "second", name: "Second" });
    if (!c.ok || !other.ok) throw new Error("setup");
    await svc.followChannel(c.value.id, "viewer");
    const followed = await svc.listFollowedByUser("viewer");
    expect(followed.map((x) => x.id)).toEqual([c.value.id]);
  });

  it("listLedByUser returns channels where the user is an active lead", async () => {
    const a = await svc.createChannelForCommunity(base);
    const b = await svc.createChannelForCommunity({ ...base, slug: "second", initialLeadUserId: "u-OTHER", initialLeadAssignedByUserId: FOUNDER });
    if (!a.ok || !b.ok) throw new Error("setup");
    const led = await svc.listLedByUser(FOUNDER);
    expect(led.map((x) => x.id)).toEqual([a.value.id]);
  });
});
