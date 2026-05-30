import { describe, expect, it } from "vitest";
import {
  createInMemoryWorkplacePostRepository,
  createNoopWorkplacePostEventPublisher,
  createWorkplacePostsService,
  type WorkplaceOwnershipResolver,
  type WorkplacePostFriendshipResolver,
  type WorkplacePostsService,
} from "../public-api";

function makeService(opts?: {
  isOwner?: (actor: string, workplaceId: string) => boolean;
  workplaceOwner?: (workplaceId: string) => string | null;
  isFriend?: (viewer: string, owner: string) => boolean;
}): WorkplacePostsService {
  const ownership: WorkplaceOwnershipResolver = {
    async isWorkplaceOwner(actor, wp) {
      return opts?.isOwner?.(actor, wp) ?? actor === "u-owner";
    },
    async getWorkplaceOwner(wp) {
      return opts?.workplaceOwner?.(wp) ?? (wp === "wp-1" ? "u-owner" : null);
    },
  };
  const friendship: WorkplacePostFriendshipResolver = {
    async areFriends(viewer, owner) {
      return opts?.isFriend?.(viewer, owner) ?? false;
    },
  };
  let seq = 0;
  return createWorkplacePostsService({
    posts: createInMemoryWorkplacePostRepository(),
    ownership,
    friendship,
    events: createNoopWorkplacePostEventPublisher(),
    clock: { now: () => new Date(`2026-05-30T01:0${seq % 10}:00Z`) },
    ids: { next: () => `wpost-${++seq}` },
  });
}

describe("content-v2/workplace-posts service", () => {
  it("owner can create a post in the workplace micro-feed", async () => {
    const svc = makeService();
    const res = await svc.createPost({
      workplaceId: "wp-1",
      actorUserId: "u-owner",
      body: "Pierwsza realizacja w tym tygodniu.",
      postType: "realization",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.status).toBe("published");
    expect(res.value.postType).toBe("realization");
    expect(res.value.visibility).toBe("workplace_public");
  });

  it("stranger cannot publish into someone else's workplace", async () => {
    const svc = makeService();
    const res = await svc.createPost({
      workplaceId: "wp-1",
      actorUserId: "u-stranger",
      body: "Spam attempt",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("rejects empty body", async () => {
    const svc = makeService();
    const res = await svc.createPost({
      workplaceId: "wp-1",
      actorUserId: "u-owner",
      body: "   ",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe("BODY_REQUIRED");
  });

  it("rejects data: media refs", async () => {
    const svc = makeService();
    const res = await svc.createPost({
      workplaceId: "wp-1",
      actorUserId: "u-owner",
      body: "test",
      mediaRefs: ["data:image/png,xxx"],
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe("MEDIA_REF_INVALID");
  });

  it("lists workplace posts with cursor + bounded limit", async () => {
    const svc = makeService();
    for (let i = 0; i < 5; i += 1) {
      await svc.createPost({ workplaceId: "wp-1", actorUserId: "u-owner", body: `post ${i}` });
    }
    const page = await svc.listForWorkplace({ workplaceId: "wp-1", limit: 3 }, "u-stranger");
    expect(page.ok).toBe(true);
    if (!page.ok) return;
    expect(page.value.items).toHaveLength(3);
    expect(page.value.nextCursor).not.toBeNull();
  });

  it("hides deactivated posts from non-owner viewers", async () => {
    const svc = makeService();
    const created = await svc.createPost({ workplaceId: "wp-1", actorUserId: "u-owner", body: "soon gone" });
    if (!created.ok) throw new Error("setup");
    await svc.deactivatePost({ postId: created.value.id, actorUserId: "u-owner" });
    const viewerSees = await svc.getPostForViewer(created.value.id, "u-stranger");
    expect(viewerSees.ok).toBe(false);
  });

  it("hides friends_only posts from strangers but shows them to friends of owner", async () => {
    const svc = makeService({
      isFriend: (v) => v === "u-friend",
    });
    const created = await svc.createPost({
      workplaceId: "wp-1",
      actorUserId: "u-owner",
      body: "friends only",
      visibility: "friends_only",
    });
    if (!created.ok) throw new Error("setup");
    const stranger = await svc.getPostForViewer(created.value.id, "u-stranger");
    expect(stranger.ok).toBe(false);
    const friend = await svc.getPostForViewer(created.value.id, "u-friend");
    expect(friend.ok).toBe(true);
  });

  it("public DTO carries no PII (only authorUserId)", async () => {
    const svc = makeService();
    const res = await svc.createPost({ workplaceId: "wp-1", actorUserId: "u-owner", body: "ok" });
    if (!res.ok) throw new Error("setup");
    expect(res.value).not.toHaveProperty("authorEmail");
    expect(res.value).not.toHaveProperty("authorPhone");
    expect(res.value.authorUserId).toBe("u-owner");
  });
});
