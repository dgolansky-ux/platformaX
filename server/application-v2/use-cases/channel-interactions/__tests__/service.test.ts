import { describe, expect, it } from "vitest";
import {
  createChannelsService,
  createInMemoryChannelInteractionSettingsRepository,
  createInMemoryChannelLeadRepository,
  createInMemoryChannelRepository,
  createInMemoryFollowRepository,
} from "@server/domains-v2/channels/public-api";
import {
  createChannelCommentService,
  createInMemoryChannelCommentRepository,
} from "@server/domains-v2/content-v2/channel-comments/public-api";
import {
  createChannelReactionService,
  createInMemoryChannelReactionRepository,
} from "@server/domains-v2/content-v2/channel-reactions/public-api";
import {
  createChannelPostService,
  createInMemoryChannelPostRepository,
} from "@server/domains-v2/content-v2/channel-posts/public-api";
import type { CommunityAuthorityResolver } from "@server/domains-v2/communities-v2/contracts";
import { createChannelInteractionsUseCase } from "../public-api";

const COMMUNITY = "comm-1";
const LEAD = "u-lead";
const CO_LEAD = "u-co";
const FOLLOWER = "u-follower";
const MEMBER = "u-member";
const STRANGER = "u-stranger";

async function fixture() {
  let seq = 0;
  const clock = { now: () => new Date(`2026-05-30T00:00:0${seq % 9}Z`) };
  const ids = { next: () => `id-${++seq}` };
  const channels = createChannelsService({
    channels: createInMemoryChannelRepository(),
    leads: createInMemoryChannelLeadRepository(),
    follows: createInMemoryFollowRepository(),
    interactionSettings: createInMemoryChannelInteractionSettingsRepository(),
    clock,
    ids,
  });
  const posts = createChannelPostService({ posts: createInMemoryChannelPostRepository(), clock, ids });
  const comments = createChannelCommentService({ comments: createInMemoryChannelCommentRepository(), clock, ids });
  const reactions = createChannelReactionService({ reactions: createInMemoryChannelReactionRepository(), clock, ids });
  const authority: CommunityAuthorityResolver = {
    canManageCommunity: async () => false,
    isCommunityMember: async (_communityId, userId) => [LEAD, CO_LEAD, FOLLOWER, MEMBER].includes(userId),
    getPublicSummary: async (communityId) => ({ id: communityId, slug: "community", name: "Community", visibility: "public" }),
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
  const channel = await channels.createChannelForCommunity({
    ownerType: "community",
    ownerId: COMMUNITY,
    slug: "news",
    name: "News",
    visibility: "public",
    initialLeadUserId: LEAD,
    initialLeadAssignedByUserId: LEAD,
  });
  const privateChannel = await channels.createChannelForCommunity({
    ownerType: "community",
    ownerId: COMMUNITY,
    slug: "private",
    name: "Private",
    visibility: "private",
    initialLeadUserId: LEAD,
    initialLeadAssignedByUserId: LEAD,
  });
  if (!channel.ok || !privateChannel.ok) throw new Error("setup");
  await channels.assignChannelLead({
    channelId: channel.value.id,
    targetUserId: CO_LEAD,
    role: "co_lead",
    permissions: ["manage_channel_profile"],
    assignedByUserId: LEAD,
  });
  await channels.followChannel(channel.value.id, FOLLOWER);
  const publicPost = await posts.create({ channelId: channel.value.id, authorUserId: LEAD, body: "Hello" });
  const privatePost = await posts.create({ channelId: privateChannel.value.id, authorUserId: LEAD, body: "Secret" });
  if (!publicPost.ok || !privatePost.ok) throw new Error("setup");
  const usecase = createChannelInteractionsUseCase({ channels, posts, comments, reactions, identity, authority });
  return { channels, usecase, channelId: channel.value.id, postId: publicPost.value.post.id, privatePostId: privatePost.value.post.id };
}

describe("channel-interactions use-case", () => {
  it("allows follower comments under followers policy and denies non-follower", async () => {
    const { usecase, postId } = await fixture();
    const ok = await usecase.createChannelPostComment({ actorUserId: FOLLOWER, channelPostId: postId, body: "Komentarz" });
    expect(ok.ok).toBe(true);
    const denied = await usecase.createChannelPostComment({ actorUserId: STRANGER, channelPostId: postId, body: "Nie" });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.code).toBe("FORBIDDEN");
  });

  it("community_members policy requires owner community membership", async () => {
    const { channels, usecase, channelId, postId } = await fixture();
    await usecase.updateChannelInteractionSettings({ actorUserId: LEAD, channelId, commentPolicy: "community_members" });
    const member = await usecase.createChannelPostComment({ actorUserId: MEMBER, channelPostId: postId, body: "Member" });
    expect(member.ok).toBe(true);
    const stranger = await usecase.createChannelPostComment({ actorUserId: STRANGER, channelPostId: postId, body: "Out" });
    expect(stranger.ok).toBe(false);
    const settings = await channels.getInteractionSettings(channelId);
    expect(settings.ok && settings.value.commentPolicy).toBe("community_members");
  });

  it("leads_only policy allows lead and blocks normal follower", async () => {
    const { usecase, channelId, postId } = await fixture();
    await usecase.updateChannelInteractionSettings({ actorUserId: LEAD, channelId, commentPolicy: "leads_only" });
    expect((await usecase.createChannelPostComment({ actorUserId: LEAD, channelPostId: postId, body: "Lead" })).ok).toBe(true);
    const denied = await usecase.createChannelPostComment({ actorUserId: FOLLOWER, channelPostId: postId, body: "Follower" });
    expect(denied.ok).toBe(false);
  });

  it("comments disabled and reactions disabled block writes", async () => {
    const { usecase, channelId, postId } = await fixture();
    await usecase.updateChannelInteractionSettings({ actorUserId: LEAD, channelId, commentsEnabled: false, reactionsEnabled: false });
    expect((await usecase.createChannelPostComment({ actorUserId: FOLLOWER, channelPostId: postId, body: "No" })).ok).toBe(false);
    expect((await usecase.reactToChannelPost({ actorUserId: FOLLOWER, channelPostId: postId, reactionType: "like", mode: "toggle" })).ok).toBe(false);
  });

  it("reacts when viewer can see post and denies private unauthorized", async () => {
    const { usecase, postId, privatePostId } = await fixture();
    const ok = await usecase.reactToChannelPost({ actorUserId: FOLLOWER, channelPostId: postId, reactionType: "like", mode: "toggle" });
    expect(ok.ok).toBe(true);
    const denied = await usecase.reactToChannelPost({ actorUserId: STRANGER, channelPostId: privatePostId, reactionType: "like", mode: "toggle" });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.code).toBe("FORBIDDEN");
  });

  it("moderation permission is required and deactivated body is hidden", async () => {
    const { channels, usecase, channelId, postId } = await fixture();
    const created = await usecase.createChannelPostComment({ actorUserId: FOLLOWER, channelPostId: postId, body: "Ukryj" });
    if (!created.ok) throw new Error("setup");
    const denied = await usecase.deactivateChannelPostComment({ actorUserId: CO_LEAD, channelPostId: postId, commentId: created.value.comment.id });
    expect(denied.ok).toBe(false);
    await channels.updateChannelLeadPermissions({
      channelId,
      targetUserId: CO_LEAD,
      permissions: ["moderate_channel_comments"],
    });
    const moderated = await usecase.deactivateChannelPostComment({
      actorUserId: CO_LEAD,
      channelPostId: postId,
      commentId: created.value.comment.id,
      moderationReason: "rules",
    });
    expect(moderated.ok).toBe(true);
    if (moderated.ok) expect(moderated.value.comment.body).toBe("");
  });

  it("summaries batch comment counts, reaction counts and viewer state", async () => {
    const { usecase, postId } = await fixture();
    await usecase.createChannelPostComment({ actorUserId: FOLLOWER, channelPostId: postId, body: "One" });
    await usecase.reactToChannelPost({ actorUserId: FOLLOWER, channelPostId: postId, reactionType: "like", mode: "set" });
    const summary = await usecase.getChannelPostInteractionSummary({ actorUserId: FOLLOWER, channelPostIds: [postId] });
    expect(summary.ok).toBe(true);
    if (!summary.ok) return;
    expect(summary.value[0].commentCount).toBe(1);
    expect(summary.value[0].reactions.counts.like).toBe(1);
    expect(summary.value[0].viewer.active).toEqual(["like"]);
    expect(JSON.stringify(summary.value)).not.toMatch(/email|phone|@/i);
  });
});
