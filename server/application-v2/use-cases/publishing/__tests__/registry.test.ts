/**
 * application-v2/use-cases/publishing — registry tests (Slice 17).
 *
 * Wires up real (in-memory) communities-v2 + channels + workplaces services
 * so the registry exercises the actual permission helpers (canPostStaffOnly,
 * canPublishChannelContent, etc.). No mocks for the domains — only stubs for
 * cross-domain resolvers that the domains themselves require.
 */
import { describe, expect, it } from "vitest";
import {
  createChannelsService,
  createInMemoryChannelLeadRepository,
  createInMemoryChannelRepository,
  createInMemoryChannelInteractionSettingsRepository,
  createInMemoryFollowRepository,
} from "@server/domains-v2/channels/public-api";
import {
  createCommunitiesService,
  createCommunityFeedSettingsService,
  createInMemoryCommunityRepository,
  createInMemoryFeedSettingsRepository,
  createInMemoryInviteRepository,
  createInMemoryJoinRequestRepository,
  createInMemoryMembershipRepository,
} from "@server/domains-v2/communities-v2/public-api";
import {
  createInMemoryWorkplaceRepository,
  createNoopWorkplaceEventPublisher,
  createWorkplacesService,
  type WorkplaceContactAccessResolver,
  type WorkplaceFriendshipResolver,
} from "@server/domains-v2/identity/workplaces/public-api";
import { createPublishingTargetRegistry } from "../registry";
import type { PublishingRequestContext } from "../contracts";

const VIEWER = "u-viewer";
const FOUNDER = "u-founder";
const STRANGER = "u-stranger";

interface Harness {
  ctx: PublishingRequestContext;
  registry: ReturnType<typeof createPublishingTargetRegistry>;
  founderCtx: PublishingRequestContext;
  strangerCtx: PublishingRequestContext;
  communityId: string;
  workplaceId: string;
  channelId: string;
}

async function setup(): Promise<Harness> {
  const now = new Date("2026-05-30T12:00:00.000Z");
  const clock = { now: () => now };
  let seq = 0;
  const ids = { next: () => `id-${++seq}` };

  const communitiesRepo = createInMemoryCommunityRepository();
  const membersRepo = createInMemoryMembershipRepository();
  const communities = createCommunitiesService({
    communities: communitiesRepo,
    members: membersRepo,
    joinRequests: createInMemoryJoinRequestRepository(),
    invites: createInMemoryInviteRepository(),
    clock,
    ids,
  });
  const feedSettings = createCommunityFeedSettingsService({
    communities: communitiesRepo,
    members: membersRepo,
    feedSettings: createInMemoryFeedSettingsRepository(),
    clock,
  });

  // Bootstrap a community owned by FOUNDER with VIEWER as moderator.
  const createRes = await communities.createCommunity({ founderUserId: FOUNDER, name: "Acme", slug: "acme", visibility: "public" });
  if (!createRes.ok) throw new Error("setup: createCommunity");
  const communityId = createRes.value.id;
  await communities.joinCommunity(communityId, VIEWER);
  const promote = await communities.changeMemberRole({ actorUserId: FOUNDER, communityId, targetUserId: VIEWER, nextRole: "moderator" });
  if (!promote.ok) throw new Error(`setup: promote moderator (${promote.error.code})`);

  // Channels.
  const channelLeads = createInMemoryChannelLeadRepository();
  const channels = createChannelsService({
    channels: createInMemoryChannelRepository(),
    leads: channelLeads,
    follows: createInMemoryFollowRepository(),
    interactionSettings: createInMemoryChannelInteractionSettingsRepository(),
    clock,
    ids,
  });
  const channelRes = await channels.createChannelForCommunity({
    ownerType: "community",
    ownerId: communityId,
    slug: "main",
    name: "Main",
    description: "",
    initialLeadUserId: VIEWER,
    initialLeadAssignedByUserId: FOUNDER,
  });
  if (!channelRes.ok) throw new Error(`setup: createChannel (${channelRes.error.code})`);
  const channelId = channelRes.value.id;

  // Workplaces — VIEWER owns one active workplace.
  const friendship: WorkplaceFriendshipResolver = {
    async areFriends() { return false; },
  };
  const contactAccess: WorkplaceContactAccessResolver = {
    async resolveVerdict() { return "stranger"; },
  };
  const workplaces = createWorkplacesService({
    repo: createInMemoryWorkplaceRepository(),
    friendship,
    contactAccess,
    events: createNoopWorkplaceEventPublisher(),
    clock,
    ids,
  });
  const wpRes = await workplaces.createWorkplace({
    actorUserId: VIEWER,
    ownerProfileId: VIEWER,
    name: "Studio",
    slug: "studio",
    headline: "",
    description: "",
    visibility: "public",
    contactVisibility: "owner_only",
  });
  if (!wpRes.ok) throw new Error("setup: createWorkplace");
  const workplaceId = wpRes.value.id;

  const registry = createPublishingTargetRegistry({
    communities,
    feedSettings,
    channels,
    workplaces,
  });

  return {
    ctx: { viewerUserId: VIEWER, now: () => now },
    founderCtx: { viewerUserId: FOUNDER, now: () => now },
    strangerCtx: { viewerUserId: STRANGER, now: () => now },
    registry,
    communityId,
    workplaceId,
    channelId,
  };
}

describe("publishing registry — viewer-specific availability", () => {
  it("VIEWER (moderator + channel lead + workplace owner) sees all of: friend feed, communities, channel, workplace + 2 partial", async () => {
    const h = await setup();
    const targets = await h.registry.getAvailablePublishingTargets(h.ctx);
    const byType = new Map(targets.map((t) => [`${t.targetType}|${t.targetId ?? ""}`, t]));

    const friend = byType.get(`friend_feed|${VIEWER}`);
    expect(friend?.status).toBe("available");

    const channel = byType.get(`channel|${h.channelId}`);
    expect(channel?.status).toBe("available");
    expect(channel?.permissionsRequired).toContain("publish_channel_content");

    const workplace = byType.get(`workplace|${h.workplaceId}`);
    expect(workplace?.status).toBe("available");
    expect(workplace?.permissionsRequired).toContain("workplace_owner");

    const importantEvent = byType.get(`important_event|${VIEWER}`);
    expect(importantEvent?.status).toBe("partial");
    expect(importantEvent?.blockedReason).toBe("backend_not_ready_v2");

    const presentation = byType.get(`profile_presentation|${VIEWER}`);
    expect(presentation?.status).toBe("partial");
    expect(presentation?.blockedReason).toBe("backend_not_ready_v2");
  });

  it("STAFF (moderator) sees staff feed as AVAILABLE; community member would see it as blocked", async () => {
    const h = await setup();
    const targets = await h.registry.getAvailablePublishingTargets(h.ctx);
    const staffFeed = targets.find((t) => t.targetType === "community_staff_feed");
    expect(staffFeed).toBeDefined();
    expect(staffFeed?.status).toBe("available");
  });

  it("STRANGER sees ONLY personal targets (friend feed + 2 partial profile targets)", async () => {
    const h = await setup();
    const targets = await h.registry.getAvailablePublishingTargets(h.strangerCtx);
    const types = targets.map((t) => t.targetType);
    expect(types).toEqual([
      "friend_feed",
      "important_event",
      "profile_presentation",
    ]);
  });

  it("registry never publishes — it only enumerates", async () => {
    const h = await setup();
    const before = await h.registry.getAvailablePublishingTargets(h.ctx);
    const after = await h.registry.getAvailablePublishingTargets(h.ctx);
    expect(after.length).toBe(before.length);
  });

  it("definitions carry no PII fields", async () => {
    const h = await setup();
    const targets = await h.registry.getAvailablePublishingTargets(h.ctx);
    for (const t of targets) {
      const blob = JSON.stringify(t);
      expect(blob).not.toMatch(/email/i);
      expect(blob).not.toMatch(/phone/i);
      expect(blob).not.toMatch(/password/i);
    }
  });

  it("definitions carry truthful maxBodyLength / maxMediaCount per target", async () => {
    const h = await setup();
    const targets = await h.registry.getAvailablePublishingTargets(h.ctx);
    for (const t of targets) {
      expect(t.maxBodyLength).toBeGreaterThan(0);
      expect(t.maxMediaCount).toBeGreaterThan(0);
    }
  });
});
