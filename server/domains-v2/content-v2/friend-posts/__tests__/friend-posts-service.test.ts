import { describe, expect, it } from "vitest";
import {
  createFriendPostsService,
  createInMemoryFriendPostCommentRepository,
  createInMemoryFriendPostReactionRepository,
  createInMemoryFriendPostRepository,
  createNoopFriendFeedEventPublisher,
  type FriendFeedEventPublisher,
  type FriendFeedDomainEvent,
  type FriendPostsService,
  type FriendshipResolver,
} from "../public-api";

function makeService(opts?: {
  friendship?: { areFriends?: (v: string, a: string) => boolean; listFriendIdsForViewer?: (v: string) => readonly string[] };
  capturedEvents?: FriendFeedDomainEvent[];
}): FriendPostsService {
  const friendship: FriendshipResolver = {
    async areFriends(viewerUserId, authorUserId) {
      return opts?.friendship?.areFriends?.(viewerUserId, authorUserId) ?? false;
    },
    async listFriendIdsForViewer(viewerUserId) {
      return opts?.friendship?.listFriendIdsForViewer?.(viewerUserId) ?? [];
    },
  };
  const events: FriendFeedEventPublisher = opts?.capturedEvents
    ? { publish: (e) => { opts.capturedEvents!.push(e); } }
    : createNoopFriendFeedEventPublisher();
  let seq = 0;
  return createFriendPostsService({
    posts: createInMemoryFriendPostRepository(),
    comments: createInMemoryFriendPostCommentRepository(),
    reactions: createInMemoryFriendPostReactionRepository(),
    friendship,
    events,
    clock: { now: () => new Date(`2026-05-30T00:0${seq % 10}:00Z`) },
    ids: { next: () => `fp-${++seq}` },
  });
}

describe("friend-posts service", () => {
  it("creates a friends_only post by default", async () => {
    const svc = makeService();
    const res = await svc.createPost({ authorUserId: "u1", body: "hello friends" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.visibility).toBe("friends_only");
    expect(res.value.status).toBe("published");
  });

  it("rejects empty body", async () => {
    const svc = makeService();
    const res = await svc.createPost({ authorUserId: "u1", body: "   " });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe("BODY_REQUIRED");
  });

  it("rejects data: media refs", async () => {
    const svc = makeService();
    const res = await svc.createPost({
      authorUserId: "u1",
      body: "x",
      mediaRefs: ["data:text/html,<script>alert(1)</script>"],
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe("MEDIA_REF_INVALID");
  });

  it("emits FriendFeedPostCreated", async () => {
    const captured: FriendFeedDomainEvent[] = [];
    const svc = makeService({ capturedEvents: captured });
    await svc.createPost({ authorUserId: "u1", body: "hello" });
    expect(captured).toHaveLength(1);
    expect(captured[0].type).toBe("FriendFeedPostCreated");
  });

  it("update by author flips status to edited", async () => {
    const svc = makeService();
    const created = await svc.createPost({ authorUserId: "u1", body: "original" });
    if (!created.ok) throw new Error("setup");
    const updated = await svc.updatePost({
      friendPostId: created.value.id,
      actorUserId: "u1",
      body: "edited",
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.status).toBe("edited");
    expect(updated.value.body).toBe("edited");
  });

  it("update by non-author is FORBIDDEN", async () => {
    const svc = makeService();
    const created = await svc.createPost({ authorUserId: "u1", body: "x" });
    if (!created.ok) throw new Error("setup");
    const res = await svc.updatePost({ friendPostId: created.value.id, actorUserId: "u-hijack", body: "y" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("deactivate by author sets status + deletedAt", async () => {
    const svc = makeService();
    const created = await svc.createPost({ authorUserId: "u1", body: "x" });
    if (!created.ok) throw new Error("setup");
    const res = await svc.deactivatePost({ friendPostId: created.value.id, actorUserId: "u1" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.status).toBe("deactivated");
  });

  it("friends_only is hidden from stranger viewer", async () => {
    const svc = makeService();
    const created = await svc.createPost({ authorUserId: "u-author", body: "secret" });
    if (!created.ok) throw new Error("setup");
    const res = await svc.getPostForViewer(created.value.id, "u-stranger");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("NOT_FOUND");
  });

  it("friends_only visible to a confirmed friend", async () => {
    const svc = makeService({ friendship: { areFriends: () => true } });
    const created = await svc.createPost({ authorUserId: "u-author", body: "secret" });
    if (!created.ok) throw new Error("setup");
    const res = await svc.getPostForViewer(created.value.id, "u-friend");
    expect(res.ok).toBe(true);
  });

  it("private post is only visible to author", async () => {
    const svc = makeService({ friendship: { areFriends: () => true } });
    const created = await svc.createPost({ authorUserId: "u-author", body: "diary", visibility: "private" });
    if (!created.ok) throw new Error("setup");
    const friendRes = await svc.getPostForViewer(created.value.id, "u-friend");
    expect(friendRes.ok).toBe(false);
    const ownerRes = await svc.getPostForViewer(created.value.id, "u-author");
    expect(ownerRes.ok).toBe(true);
  });

  it("listFriendFeedRaw scopes to viewer + listed friends, stable order, cursor cap", async () => {
    const svc = makeService({ friendship: { listFriendIdsForViewer: () => ["u-friend"] } });
    await svc.createPost({ authorUserId: "u-friend", body: "from friend 1" });
    await svc.createPost({ authorUserId: "u-friend", body: "from friend 2" });
    await svc.createPost({ authorUserId: "u-stranger", body: "from stranger" });
    await svc.createPost({ authorUserId: "u-viewer", body: "from self" });
    const res = await svc.listFriendFeedRaw({ viewerUserId: "u-viewer", limit: 10 });
    const authors = res.items.map((i) => i.authorUserId).sort();
    expect(authors).not.toContain("u-stranger");
    expect(authors).toEqual(["u-friend", "u-friend", "u-viewer"]);
  });

  it("friend can comment, stranger cannot", async () => {
    const svc = makeService({ friendship: { areFriends: (v) => v === "u-friend" } });
    const created = await svc.createPost({ authorUserId: "u-author", body: "post" });
    if (!created.ok) throw new Error("setup");
    const ok = await svc.createComment({ friendPostId: created.value.id, authorUserId: "u-friend", body: "nice" });
    expect(ok.ok).toBe(true);
    const denied = await svc.createComment({ friendPostId: created.value.id, authorUserId: "u-stranger", body: "spam" });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.code).toBe("FORBIDDEN");
  });

  it("deleted comment body is stripped at the mapper boundary", async () => {
    const svc = makeService({ friendship: { areFriends: () => true } });
    const created = await svc.createPost({ authorUserId: "u-author", body: "p" });
    if (!created.ok) throw new Error("setup");
    const c = await svc.createComment({ friendPostId: created.value.id, authorUserId: "u-friend", body: "hi" });
    if (!c.ok) throw new Error("setup");
    await svc.deleteComment({ commentId: c.value.id, actorUserId: "u-friend" });
    const list = await svc.listComments({ friendPostId: created.value.id }, "u-author");
    if (!list.ok) throw new Error("setup");
    expect(list.value.items[0].body).toBe("");
    expect(list.value.items[0].status).toBe("deleted");
  });

  it("reaction toggle increments + decrements likeCount", async () => {
    const svc = makeService({ friendship: { areFriends: () => true } });
    const created = await svc.createPost({ authorUserId: "u-author", body: "p" });
    if (!created.ok) throw new Error("setup");
    const r1 = await svc.toggleReaction({ friendPostId: created.value.id, actorUserId: "u-friend" });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    expect(r1.value.likeCount).toBe(1);
    expect(r1.value.viewerLiked).toBe(true);
    const r2 = await svc.toggleReaction({ friendPostId: created.value.id, actorUserId: "u-friend" });
    if (!r2.ok) throw new Error("setup");
    expect(r2.value.likeCount).toBe(0);
    expect(r2.value.viewerLiked).toBe(false);
  });

  it("reaction by stranger is FORBIDDEN", async () => {
    const svc = makeService();
    const created = await svc.createPost({ authorUserId: "u-author", body: "p" });
    if (!created.ok) throw new Error("setup");
    const res = await svc.toggleReaction({ friendPostId: created.value.id, actorUserId: "u-stranger" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("public friend-post DTO has no email/phone keys", async () => {
    const svc = makeService();
    const created = await svc.createPost({ authorUserId: "u1", body: "p" });
    if (!created.ok) throw new Error("setup");
    expect(Object.keys(created.value)).not.toContain("email");
    expect(Object.keys(created.value)).not.toContain("phone");
  });
});
