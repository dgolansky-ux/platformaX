import { describe, expect, it } from "vitest";
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
  createCommentService,
  createCommunityFeedService,
  createInMemoryCommentRepository,
  createInMemoryCommunityFeedItemRepository,
  createInMemoryCommunityPostRepository,
  createInMemoryReactionRepository,
  createReactionService,
} from "@server/domains-v2/content-v2/public-api";
import { createCommunityInteractionsUseCase } from "../service";

const FOUNDER = "u-founder";
const MOD = "u-mod";
const MEMBER = "u-member";
const STRANGER = "u-stranger";

async function setup() {
  const communities = createInMemoryCommunityRepository();
  const members = createInMemoryMembershipRepository();
  const joinRequests = createInMemoryJoinRequestRepository();
  const invites = createInMemoryInviteRepository();
  const feedSettingsRepo = createInMemoryFeedSettingsRepository();
  const posts = createInMemoryCommunityPostRepository();
  const items = createInMemoryCommunityFeedItemRepository();
  const commentRepo = createInMemoryCommentRepository();
  const reactionRepo = createInMemoryReactionRepository();
  let seq = 0;
  let tick = 0;
  const clock = { now: () => new Date(new Date("2026-05-29T10:00:00.000Z").getTime() + tick++ * 1000) };
  const ids = { next: () => `id-${++seq}` };

  const communitiesService = createCommunitiesService({ communities, members, joinRequests, invites, clock, ids });
  const feedSettings = createCommunityFeedSettingsService({ communities, members, feedSettings: feedSettingsRepo, clock });
  const content = createCommunityFeedService({ posts, items, clock, ids });
  const comments = createCommentService({ repo: commentRepo, clock, ids });
  const reactions = createReactionService({ repo: reactionRepo, clock, ids });
  const useCase = createCommunityInteractionsUseCase({ communities: communitiesService, feedSettings, content, comments, reactions });

  const root = await communitiesService.createCommunity({ founderUserId: FOUNDER, name: "Acme", slug: "acme", visibility: "public" });
  if (!root.ok) throw new Error("root");
  const rootId = root.value.id;
  await members.add({ communityId: rootId, userId: MOD, role: "moderator", status: "active", joinedAt: clock.now().toISOString() });
  await members.add({ communityId: rootId, userId: MEMBER, role: "member", status: "active", joinedAt: clock.now().toISOString() });

  const created = await content.createCommunityPost({
    authorUserId: FOUNDER, publishedByUserId: FOUNDER, body: "Witajcie!", sourceCommunityId: rootId, feedType: "community_all",
  });
  if (!created.ok) throw new Error("post");
  const staffPost = await content.createCommunityPost({
    authorUserId: FOUNDER, publishedByUserId: FOUNDER, body: "Sekret kadry", sourceCommunityId: rootId, feedType: "staff_only",
  });
  if (!staffPost.ok) throw new Error("staff post");

  return {
    useCase, content, rootId,
    mainFeedItemId: created.value.item.id,
    staffFeedItemId: staffPost.value.item.id,
  };
}

async function setupWithDistribution() {
  const communities = createInMemoryCommunityRepository();
  const members = createInMemoryMembershipRepository();
  const joinRequests = createInMemoryJoinRequestRepository();
  const invites = createInMemoryInviteRepository();
  const feedSettingsRepo = createInMemoryFeedSettingsRepository();
  const posts = createInMemoryCommunityPostRepository();
  const items = createInMemoryCommunityFeedItemRepository();
  const commentRepo = createInMemoryCommentRepository();
  const reactionRepo = createInMemoryReactionRepository();
  let seq = 0;
  let tick = 0;
  const clock = { now: () => new Date(new Date("2026-05-29T10:00:00.000Z").getTime() + tick++ * 1000) };
  const ids = { next: () => `id-${++seq}` };

  const communitiesService = createCommunitiesService({ communities, members, joinRequests, invites, clock, ids });
  const feedSettings = createCommunityFeedSettingsService({ communities, members, feedSettings: feedSettingsRepo, clock });
  const content = createCommunityFeedService({ posts, items, clock, ids });
  const comments = createCommentService({ repo: commentRepo, clock, ids });
  const reactions = createReactionService({ repo: reactionRepo, clock, ids });
  const useCase = createCommunityInteractionsUseCase({ communities: communitiesService, feedSettings, content, comments, reactions });

  const root = await communitiesService.createCommunity({ founderUserId: FOUNDER, name: "Acme", slug: "acme", visibility: "public" });
  if (!root.ok) throw new Error("root");
  const rootId = root.value.id;
  const child = await communitiesService.createCommunity({ founderUserId: FOUNDER, name: "Child", slug: "child", visibility: "public" });
  if (!child.ok) throw new Error("child");
  const childId = child.value.id;
  await members.add({ communityId: rootId, userId: MEMBER, role: "member", status: "active", joinedAt: clock.now().toISOString() });
  await members.add({ communityId: childId, userId: MEMBER, role: "member", status: "active", joinedAt: clock.now().toISOString() });

  const created = await content.createCommunityPost({
    authorUserId: FOUNDER, publishedByUserId: FOUNDER, body: "Down", sourceCommunityId: rootId, feedType: "community_all", distributionId: "d1",
  });
  if (!created.ok) throw new Error("post");
  const dist = await content.distributeCommunityPost({
    postId: created.value.post.id, authorUserId: FOUNDER, publishedByUserId: FOUNDER, body: "Down",
    targetCommunityId: childId, feedType: "community_all", sourceCommunityId: rootId, distributionId: "d1",
  });
  if (!dist.ok) throw new Error("dist");

  return { useCase, rootItemId: created.value.item.id, childItemId: dist.value.id };
}

describe("community-interactions — comments", () => {
  it("a member can comment on community_all", async () => {
    const { useCase, mainFeedItemId } = await setup();
    const res = await useCase.createCommunityPostComment({ actorUserId: MEMBER, feedItemId: mainFeedItemId, body: "Świetne!" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.comment.body).toBe("Świetne!");
    expect(res.value.comment.feedItemId).toBe(mainFeedItemId);
  });

  it("a stranger cannot comment on community_all", async () => {
    const { useCase, mainFeedItemId } = await setup();
    const res = await useCase.createCommunityPostComment({ actorUserId: STRANGER, feedItemId: mainFeedItemId, body: "hi" });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("FORBIDDEN");
  });

  it("a member cannot comment on a staff_only feed item", async () => {
    const { useCase, staffFeedItemId } = await setup();
    const res = await useCase.createCommunityPostComment({ actorUserId: MEMBER, feedItemId: staffFeedItemId, body: "hi" });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("FORBIDDEN");
  });

  it("a moderator can comment on staff_only", async () => {
    const { useCase, staffFeedItemId } = await setup();
    const res = await useCase.createCommunityPostComment({ actorUserId: MOD, feedItemId: staffFeedItemId, body: "Kadrowo" });
    expect(res.ok).toBe(true);
  });

  it("listing comments is denied for members of staff_only feed", async () => {
    const { useCase, staffFeedItemId } = await setup();
    await useCase.createCommunityPostComment({ actorUserId: FOUNDER, feedItemId: staffFeedItemId, body: "kadra" });
    const member = await useCase.listCommunityPostComments({ actorUserId: MEMBER, feedItemId: staffFeedItemId });
    expect(member.ok).toBe(false);
    if (member.ok) return;
    expect(member.error.code).toBe("FORBIDDEN");
  });

  it("only the author can update/delete their own comment", async () => {
    const { useCase, mainFeedItemId } = await setup();
    const c = await useCase.createCommunityPostComment({ actorUserId: MEMBER, feedItemId: mainFeedItemId, body: "moja" });
    if (!c.ok) return;
    const denied = await useCase.updateCommunityComment({ actorUserId: MOD, feedItemId: mainFeedItemId, commentId: c.value.comment.id, body: "hack" });
    expect(denied.ok).toBe(false);
    if (denied.ok) return;
    expect(denied.error.code).toBe("FORBIDDEN_AUTHOR_ONLY");
    const ok = await useCase.updateCommunityComment({ actorUserId: MEMBER, feedItemId: mainFeedItemId, commentId: c.value.comment.id, body: "moja v2" });
    expect(ok.ok).toBe(true);
    const del = await useCase.deleteCommunityComment({ actorUserId: MEMBER, feedItemId: mainFeedItemId, commentId: c.value.comment.id });
    expect(del.ok).toBe(true);
    if (del.ok) expect(del.value.comment.status).toBe("deleted");
  });
});

describe("community-interactions — reactions", () => {
  it("a member can toggle like on community_all", async () => {
    const { useCase, mainFeedItemId } = await setup();
    const on = await useCase.reactToCommunityPost({ actorUserId: MEMBER, feedItemId: mainFeedItemId, reactionType: "like", mode: "toggle" });
    expect(on.ok && on.value.active).toBe(true);
    if (on.ok) expect(on.value.reactions.counts.like).toBe(1);
    const off = await useCase.reactToCommunityPost({ actorUserId: MEMBER, feedItemId: mainFeedItemId, reactionType: "like", mode: "toggle" });
    expect(off.ok && off.value.active).toBe(false);
    if (off.ok) expect(off.value.reactions.counts.like).toBe(0);
  });

  it("a member cannot react on staff_only", async () => {
    const { useCase, staffFeedItemId } = await setup();
    const res = await useCase.reactToCommunityPost({ actorUserId: MEMBER, feedItemId: staffFeedItemId, reactionType: "like", mode: "set" });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("FORBIDDEN");
  });

  it("a stranger cannot react", async () => {
    const { useCase, mainFeedItemId } = await setup();
    const res = await useCase.reactToCommunityPost({ actorUserId: STRANGER, feedItemId: mainFeedItemId, reactionType: "like", mode: "toggle" });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("FORBIDDEN");
  });

  it("a member can react on a comment they can see", async () => {
    const { useCase, mainFeedItemId } = await setup();
    const c = await useCase.createCommunityPostComment({ actorUserId: FOUNDER, feedItemId: mainFeedItemId, body: "post" });
    if (!c.ok) return;
    const res = await useCase.reactToCommunityComment({ actorUserId: MEMBER, feedItemId: mainFeedItemId, commentId: c.value.comment.id, reactionType: "like", mode: "set" });
    expect(res.ok && res.value.active).toBe(true);
    if (res.ok) expect(res.value.reactions.counts.like).toBe(1);
  });

  it("post interaction summary batch returns counts only for visible items", async () => {
    const { useCase, mainFeedItemId, staffFeedItemId } = await setup();
    await useCase.reactToCommunityPost({ actorUserId: MEMBER, feedItemId: mainFeedItemId, reactionType: "like", mode: "set" });
    await useCase.createCommunityPostComment({ actorUserId: MEMBER, feedItemId: mainFeedItemId, body: "hi" });
    await useCase.createCommunityPostComment({ actorUserId: FOUNDER, feedItemId: staffFeedItemId, body: "secret" });
    const member = await useCase.getCommunityPostInteractionSummary({ actorUserId: MEMBER, feedItemIds: [mainFeedItemId, staffFeedItemId] });
    expect(member.ok).toBe(true);
    if (!member.ok) return;
    expect(member.value).toHaveLength(1);
    expect(member.value[0].feedItemId).toBe(mainFeedItemId);
    expect(member.value[0].commentCount).toBe(1);
    expect(member.value[0].reactions.counts.like).toBe(1);
    expect(member.value[0].viewer.active).toEqual(["like"]);
    const founder = await useCase.getCommunityPostInteractionSummary({ actorUserId: FOUNDER, feedItemIds: [mainFeedItemId, staffFeedItemId] });
    if (!founder.ok) return;
    expect(founder.value).toHaveLength(2);
  });

  it("DTO carries no PII", async () => {
    const { useCase, mainFeedItemId } = await setup();
    await useCase.createCommunityPostComment({ actorUserId: FOUNDER, feedItemId: mainFeedItemId, body: "hi" });
    const list = await useCase.listCommunityPostComments({ actorUserId: FOUNDER, feedItemId: mainFeedItemId });
    expect(JSON.stringify(list)).not.toMatch(/email|phone|@/i);
  });
});

describe("community-interactions — propagation locality", () => {
  it("comments on a distributed post stay local to the target community", async () => {
    const { useCase, rootItemId, childItemId } = await setupWithDistribution();
    await useCase.createCommunityPostComment({ actorUserId: MEMBER, feedItemId: rootItemId, body: "root comment" });
    await useCase.createCommunityPostComment({ actorUserId: MEMBER, feedItemId: childItemId, body: "child comment" });
    const rootList = await useCase.listCommunityPostComments({ actorUserId: MEMBER, feedItemId: rootItemId });
    if (!rootList.ok) return;
    expect(rootList.value.items.map((c) => c.body)).toEqual(["root comment"]);
    const childList = await useCase.listCommunityPostComments({ actorUserId: MEMBER, feedItemId: childItemId });
    if (!childList.ok) return;
    expect(childList.value.items.map((c) => c.body)).toEqual(["child comment"]);
  });

  it("reactions on a distributed post stay local — root and child counts are independent", async () => {
    const { useCase, rootItemId, childItemId } = await setupWithDistribution();
    await useCase.reactToCommunityPost({ actorUserId: MEMBER, feedItemId: rootItemId, reactionType: "like", mode: "set" });
    const root = await useCase.getCommunityPostInteractionSummary({ actorUserId: MEMBER, feedItemIds: [rootItemId] });
    const child = await useCase.getCommunityPostInteractionSummary({ actorUserId: MEMBER, feedItemIds: [childItemId] });
    if (!root.ok || !child.ok) return;
    expect(root.value[0].reactions.counts.like).toBe(1);
    expect(child.value[0].reactions.counts.like).toBe(0);
  });
});

describe("community-interactions — architecture", () => {
  it("orchestrator does not import internals of either domain", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const file = fs.readFileSync(path.resolve(__dirname, "../service.ts"), "utf-8");
    expect(file).not.toMatch(/from\s+["']@server\/domains-v2\/(communities-v2|content-v2)\/(?!public-api)/);
  });
});
