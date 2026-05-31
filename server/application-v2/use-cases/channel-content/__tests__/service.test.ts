import { describe, expect, it } from "vitest";
import {
  createChannelsService,
  createInMemoryChannelLeadRepository,
  createInMemoryChannelRepository,
  createInMemoryFollowRepository,
} from "@server/domains-v2/channels/public-api";
import {
  createChannelPostService,
  createInMemoryChannelPostRepository,
} from "@server/domains-v2/content-v2/channel-posts/public-api";
import type { CommunityAuthorityResolver } from "@server/domains-v2/communities-v2/contracts";
import { createChannelContentUseCase } from "../public-api";

const COMMUNITY = "comm-1";
const LEAD = "u-lead";
const CO_LEAD = "u-co";
const ADMIN = "u-admin";
const FOLLOWER = "u-follower";
const STRANGER = "u-stranger";

async function fixture() {
  let seq = 0;
  const clock = { now: () => new Date(`2026-05-29T00:00:0${seq % 9}Z`) };
  const ids = { next: () => `id-${++seq}` };
  const channels = createChannelsService({
    channels: createInMemoryChannelRepository(),
    leads: createInMemoryChannelLeadRepository(),
    follows: createInMemoryFollowRepository(),
    clock,
    ids,
  });
  const posts = createChannelPostService({
    posts: createInMemoryChannelPostRepository(),
    clock,
    ids,
  });
  const authority: CommunityAuthorityResolver = {
    canManageCommunity: async (_communityId, userId) => userId === ADMIN,
    isCommunityMember: async (_communityId, userId) => [LEAD, CO_LEAD, ADMIN, FOLLOWER].includes(userId),
    getPublicSummary: async (communityId) => ({
      id: communityId,
      slug: "community",
      name: "Community",
      visibility: "public",
      memberCount: 4,
    }),
  };
  const identity = {
    async getPublicProfile(_viewerId: string | null, profileUserId: string) {
      return {
        ok: true as const,
        value: {
          userId: profileUserId,
          profileSlug: profileUserId,
          displayName: `User ${profileUserId}`,
          avatarMediaRef: null,
          bannerMediaRef: null,
          bio: null,
          location: null,
          civilStatus: null,
          socialLinks: null,
          personalStatus: null,
          visibility: "public" as const,
          onboardingCompleted: true,
        },
      };
    },
  };
  const pub = await channels.createChannelForCommunity({
    ownerType: "community",
    ownerId: COMMUNITY,
    slug: "news",
    name: "News",
    visibility: "public",
    initialLeadUserId: LEAD,
    initialLeadAssignedByUserId: ADMIN,
  });
  const priv = await channels.createChannelForCommunity({
    ownerType: "community",
    ownerId: COMMUNITY,
    slug: "private",
    name: "Private",
    visibility: "private",
    initialLeadUserId: LEAD,
    initialLeadAssignedByUserId: ADMIN,
  });
  if (!pub.ok || !priv.ok) throw new Error("setup");
  await channels.assignChannelLead({
    channelId: pub.value.id,
    targetUserId: CO_LEAD,
    role: "co_lead",
    permissions: ["manage_channel_profile"],
    assignedByUserId: ADMIN,
  });
  return {
    channels,
    usecase: createChannelContentUseCase({ channels, posts, identity, authority }),
    publicChannelId: pub.value.id,
    privateChannelId: priv.value.id,
  };
}

describe("channel-content use-case", () => {
  it("lead with publish permission can publish", async () => {
    const { usecase, publicChannelId } = await fixture();
    const res = await usecase.createChannelPost({ actorUserId: LEAD, channelId: publicChannelId, body: "Hello" });
    expect(res.ok).toBe(true);
  });

  it("co_lead without publish permission and community admin not lead are denied publishing", async () => {
    const { usecase, publicChannelId } = await fixture();
    const co = await usecase.createChannelPost({ actorUserId: CO_LEAD, channelId: publicChannelId, body: "No" });
    expect(co.ok).toBe(false);
    if (!co.ok) expect(co.error.code).toBe("FORBIDDEN");
    const admin = await usecase.createChannelPost({ actorUserId: ADMIN, channelId: publicChannelId, body: "No" });
    expect(admin.ok).toBe(false);
  });

  it("lead with manage permission can deactivate another author post", async () => {
    const { usecase, publicChannelId } = await fixture();
    const post = await usecase.createChannelPost({ actorUserId: LEAD, channelId: publicChannelId, body: "Hello" });
    if (!post.ok) throw new Error("setup");
    const res = await usecase.deactivateChannelPost({ actorUserId: LEAD, postId: post.value.id });
    expect(res.ok).toBe(true);
  });

  it("lead without pin permission cannot pin", async () => {
    const { usecase, publicChannelId, channels } = await fixture();
    await channels.updateChannelLeadPermissions({
      channelId: publicChannelId,
      targetUserId: LEAD,
      permissions: ["publish_channel_content"],
    });
    const post = await usecase.createChannelPost({ actorUserId: LEAD, channelId: publicChannelId, body: "Hello" });
    if (!post.ok) throw new Error("setup");
    const res = await usecase.pinChannelPost({ actorUserId: LEAD, postId: post.value.id });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("pinned post and feed page are returned with public author summary", async () => {
    const { usecase, publicChannelId } = await fixture();
    const post = await usecase.createChannelPost({ actorUserId: LEAD, channelId: publicChannelId, body: "Pinned" });
    if (!post.ok) throw new Error("setup");
    await usecase.pinChannelPost({ actorUserId: LEAD, postId: post.value.id });
    const page = await usecase.getChannelPageView({ viewerUserId: FOLLOWER, channelId: publicChannelId, limit: 10 });
    expect(page.ok).toBe(true);
    if (!page.ok) return;
    expect(page.value.feed.pinnedPost?.postId).toBe(post.value.id);
    expect(page.value.feed.items[0].authorPublicSummary?.displayName).toBe(`User ${LEAD}`);
  });

  it("private channel feed is denied to unauthorized viewer", async () => {
    const { usecase, privateChannelId } = await fixture();
    const res = await usecase.listChannelFeed({ viewerUserId: STRANGER, channelId: privateChannelId });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });
});
