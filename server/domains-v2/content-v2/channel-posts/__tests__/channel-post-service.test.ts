import { beforeEach, describe, expect, it } from "vitest";
import {
  createChannelPostService,
  type ChannelPostService,
} from "../public-api";
import { createInMemoryChannelPostRepository } from "../public-api";

function makeService(): ChannelPostService {
  let seq = 0;
  return createChannelPostService({
    posts: createInMemoryChannelPostRepository(),
    clock: { now: () => new Date(`2026-05-29T00:00:0${seq % 9}Z`) },
    ids: { next: () => `cp-${++seq}` },
  });
}

describe("content-v2/channel-posts service", () => {
  let svc: ChannelPostService;
  beforeEach(() => {
    svc = makeService();
  });

  it("creates a public-safe channel post DTO", async () => {
    const res = await svc.create({ channelId: "ch-1", authorUserId: "u-1", body: "Pierwszy wpis" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.post.body).toBe("Pierwszy wpis");
    expect(JSON.stringify(res.value.post)).not.toMatch(/email|phone|@/i);
  });

  it("rejects empty bodies", async () => {
    const res = await svc.create({ channelId: "ch-1", authorUserId: "u-1", body: "   " });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("EMPTY_BODY");
  });

  it("lets author update and manager deactivate", async () => {
    const created = await svc.create({ channelId: "ch-1", authorUserId: "u-1", body: "A" });
    if (!created.ok) throw new Error("setup");
    const updated = await svc.update({
      postId: created.value.post.id,
      actorUserId: "u-1",
      body: "B",
      canManage: false,
    });
    expect(updated.ok).toBe(true);
    const deactivated = await svc.deactivate({
      postId: created.value.post.id,
      actorUserId: "lead-1",
      canManage: true,
    });
    expect(deactivated.ok).toBe(true);
    const feed = await svc.listFeed({ channelId: "ch-1" });
    expect(feed.items).toHaveLength(0);
  });

  it("blocks non-author update without manage permission", async () => {
    const created = await svc.create({ channelId: "ch-1", authorUserId: "u-1", body: "A" });
    if (!created.ok) throw new Error("setup");
    const updated = await svc.update({
      postId: created.value.post.id,
      actorUserId: "u-2",
      body: "B",
      canManage: false,
    });
    expect(updated.ok).toBe(false);
    if (!updated.ok) expect(updated.error.code).toBe("FORBIDDEN");
  });

  it("keeps one pinned post per channel and lists pinned first", async () => {
    const a = await svc.create({ channelId: "ch-1", authorUserId: "u-1", body: "A" });
    const b = await svc.create({ channelId: "ch-1", authorUserId: "u-1", body: "B" });
    if (!a.ok || !b.ok) throw new Error("setup");
    await svc.pin({ postId: a.value.post.id, actorUserId: "lead-1" });
    await svc.pin({ postId: b.value.post.id, actorUserId: "lead-1" });
    const feed = await svc.listFeed({ channelId: "ch-1", limit: 10 });
    expect(feed.pinnedPost?.postId).toBe(b.value.post.id);
    expect(feed.items[0].postId).toBe(b.value.post.id);
    expect(feed.items.filter((p) => p.pinned)).toHaveLength(1);
  });

  it("paginates channel feed with stable order", async () => {
    for (let i = 0; i < 3; i += 1) {
      await svc.create({ channelId: "ch-1", authorUserId: "u-1", body: `Post ${i}` });
    }
    const first = await svc.listFeed({ channelId: "ch-1", limit: 2 });
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).not.toBeNull();
    const second = await svc.listFeed({ channelId: "ch-1", cursor: first.nextCursor, limit: 2 });
    expect(second.items).toHaveLength(1);
  });
});
