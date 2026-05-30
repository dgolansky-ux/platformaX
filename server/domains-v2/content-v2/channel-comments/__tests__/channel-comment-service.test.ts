import { describe, expect, it } from "vitest";
import {
  createChannelCommentService,
  createInMemoryChannelCommentRepository,
  type ChannelCommentService,
} from "../public-api";

function makeService(): ChannelCommentService {
  let seq = 0;
  return createChannelCommentService({
    comments: createInMemoryChannelCommentRepository(),
    clock: { now: () => new Date("2026-05-30T00:00:00Z") },
    ids: { next: () => `cc-${++seq}` },
  });
}

describe("content-v2/channel-comments", () => {
  it("creates and lists comments with stable cursor order", async () => {
    const svc = makeService();
    const a = await svc.create({ channelPostId: "post-1", authorUserId: "u1", body: "Pierwszy" });
    const b = await svc.create({ channelPostId: "post-1", authorUserId: "u2", body: "Drugi" });
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    const page = await svc.list({ channelPostId: "post-1", limit: 1 });
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBe("cc-1");
    const page2 = await svc.list({ channelPostId: "post-1", cursor: page.nextCursor, limit: 10 });
    expect(page2.items.map((x) => x.id)).toEqual(["cc-2"]);
  });

  it("updates own comment and rejects another author without moderation", async () => {
    const svc = makeService();
    const created = await svc.create({ channelPostId: "post-1", authorUserId: "u1", body: "Treść" });
    if (!created.ok) throw new Error("setup");
    const denied = await svc.update({ commentId: created.value.comment.id, actorUserId: "u2", body: "X" });
    expect(denied.ok).toBe(false);
    const updated = await svc.update({ commentId: created.value.comment.id, actorUserId: "u1", body: "Po edycji" });
    expect(updated.ok).toBe(true);
    if (updated.ok) expect(updated.value.comment.status).toBe("edited");
  });

  it("soft deactivates own comment and hides body", async () => {
    const svc = makeService();
    const created = await svc.create({ channelPostId: "post-1", authorUserId: "u1", body: "Sekret" });
    if (!created.ok) throw new Error("setup");
    const deleted = await svc.deactivate({ commentId: created.value.comment.id, actorUserId: "u1" });
    expect(deleted.ok).toBe(true);
    if (!deleted.ok) return;
    expect(deleted.value.comment.status).toBe("deactivated");
    expect(deleted.value.comment.body).toBe("");
  });

  it("moderates another comment with metadata and counts active only", async () => {
    const svc = makeService();
    const created = await svc.create({ channelPostId: "post-1", authorUserId: "u1", body: "Ukryj mnie" });
    await svc.create({ channelPostId: "post-1", authorUserId: "u2", body: "Zostaje" });
    if (!created.ok) throw new Error("setup");
    const moderated = await svc.deactivate({
      commentId: created.value.comment.id,
      actorUserId: "lead",
      canModerate: true,
      moderationReason: "off-topic",
    });
    expect(moderated.ok).toBe(true);
    if (!moderated.ok) return;
    expect(moderated.value.comment.moderatedByUserId).toBe("lead");
    expect(await svc.countActive("post-1")).toBe(1);
    const batch = await svc.countActiveBatch(["post-1", "post-2"]);
    expect(batch.get("post-1")).toBe(1);
    expect(batch.get("post-2")).toBe(0);
  });

  it("DTO carries no private contact fields", async () => {
    const svc = makeService();
    const created = await svc.create({ channelPostId: "post-1", authorUserId: "user-id", body: "Public body" });
    expect(created.ok).toBe(true);
    if (created.ok) expect(JSON.stringify(created.value.comment)).not.toMatch(/email|phone|@/i);
  });
});
