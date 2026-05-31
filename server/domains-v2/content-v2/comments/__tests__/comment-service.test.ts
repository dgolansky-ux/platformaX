import { describe, expect, it } from "vitest";
import { createCommentService } from "../service";
import { createInMemoryCommentRepository } from "../store";

function makeService(now = "2026-05-29T10:00:00.000Z") {
  const repo = createInMemoryCommentRepository();
  let seq = 0;
  let tick = 0;
  const clock = { now: () => new Date(new Date(now).getTime() + tick++ * 1000) };
  const ids = { next: () => `c-${++seq}` };
  return { svc: createCommentService({ repo, clock, ids }), repo };
}

describe("content-v2 comments service", () => {
  it("creates an active comment under a feed item", async () => {
    const { svc } = makeService();
    const res = await svc.createComment({ feedItemId: "fi-1", authorUserId: "u1", body: "Świetny post!" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.comment.feedItemId).toBe("fi-1");
    expect(res.value.comment.status).toBe("active");
    expect(res.value.comment.body).toBe("Świetny post!");
  });

  it("rejects an empty body", async () => {
    const { svc } = makeService();
    const res = await svc.createComment({ feedItemId: "fi-1", authorUserId: "u1", body: "   " });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("EMPTY_BODY");
  });

  it("rejects a body longer than the cap", async () => {
    const { svc } = makeService();
    const tooLong = "x".repeat(2001);
    const res = await svc.createComment({ feedItemId: "fi-1", authorUserId: "u1", body: tooLong });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("BODY_TOO_LONG");
  });

  it("only the author can update their comment", async () => {
    const { svc } = makeService();
    const c = await svc.createComment({ feedItemId: "fi-1", authorUserId: "u1", body: "v1" });
    if (!c.ok) return;
    const ok = await svc.updateOwnComment({ commentId: c.value.comment.id, actorUserId: "u1", body: "v2" });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value.comment.body).toBe("v2");
    const denied = await svc.updateOwnComment({ commentId: c.value.comment.id, actorUserId: "uX", body: "hack" });
    expect(denied.ok).toBe(false);
    if (denied.ok) return;
    expect(denied.error.code).toBe("FORBIDDEN_AUTHOR_ONLY");
  });

  it("soft-deletes own comment and strips body in DTO", async () => {
    const { svc } = makeService();
    const c = await svc.createComment({ feedItemId: "fi-1", authorUserId: "u1", body: "tajne" });
    if (!c.ok) return;
    const del = await svc.deleteOwnComment({ commentId: c.value.comment.id, actorUserId: "u1" });
    expect(del.ok).toBe(true);
    if (!del.ok) return;
    expect(del.value.comment.status).toBe("deleted");
    expect(del.value.comment.body).toBe("");
    const list = await svc.listComments({ feedItemId: "fi-1" });
    expect(list.items).toHaveLength(1);
    expect(list.items[0].status).toBe("deleted");
    expect(list.items[0].body).toBe("");
  });

  it("non-author cannot delete a comment", async () => {
    const { svc } = makeService();
    const c = await svc.createComment({ feedItemId: "fi-1", authorUserId: "u1", body: "ok" });
    if (!c.ok) return;
    const denied = await svc.deleteOwnComment({ commentId: c.value.comment.id, actorUserId: "uX" });
    expect(denied.ok).toBe(false);
    if (denied.ok) return;
    expect(denied.error.code).toBe("FORBIDDEN_AUTHOR_ONLY");
  });

  it("lists comments oldest-first, scoped per feed item, with cursor", async () => {
    const { svc } = makeService();
    await svc.createComment({ feedItemId: "fi-1", authorUserId: "u1", body: "A" });
    await svc.createComment({ feedItemId: "fi-1", authorUserId: "u1", body: "B" });
    await svc.createComment({ feedItemId: "fi-1", authorUserId: "u1", body: "C" });
    await svc.createComment({ feedItemId: "fi-2", authorUserId: "u1", body: "OTHER" });
    const page = await svc.listComments({ feedItemId: "fi-1", limit: 2 });
    expect(page.items.map((i) => i.body)).toEqual(["A", "B"]);
    expect(page.nextCursor).not.toBeNull();
    const page2 = await svc.listComments({ feedItemId: "fi-1", cursor: page.nextCursor, limit: 5 });
    expect(page2.items.map((i) => i.body)).toEqual(["C"]);
    // fi-1 list does NOT include fi-2 comment
    const other = await svc.listComments({ feedItemId: "fi-2" });
    expect(other.items.map((i) => i.body)).toEqual(["OTHER"]);
  });

  it("counts active comments per feed item (single + batch)", async () => {
    const { svc } = makeService();
    const a = await svc.createComment({ feedItemId: "fi-1", authorUserId: "u1", body: "A" });
    await svc.createComment({ feedItemId: "fi-1", authorUserId: "u2", body: "B" });
    await svc.createComment({ feedItemId: "fi-2", authorUserId: "u1", body: "C" });
    if (a.ok) await svc.deleteOwnComment({ commentId: a.value.comment.id, actorUserId: "u1" });
    expect(await svc.countActive({ feedItemId: "fi-1" })).toBe(1);
    const batch = await svc.countActiveBatch(["fi-1", "fi-2", "fi-missing"]);
    expect(batch.get("fi-1")).toBe(1);
    expect(batch.get("fi-2")).toBe(1);
    expect(batch.get("fi-missing")).toBe(0);
  });

  it("comment DTO carries no PII", async () => {
    const { svc } = makeService();
    const c = await svc.createComment({ feedItemId: "fi-1", authorUserId: "u1", body: "Cześć!" });
    if (!c.ok) return;
    const list = await svc.listComments({ feedItemId: "fi-1" });
    expect(JSON.stringify({ c: c.value, list })).not.toMatch(/email|phone|@/i);
  });

  it("parentCommentId must exist in the same thread", async () => {
    const { svc } = makeService();
    const root = await svc.createComment({ feedItemId: "fi-1", authorUserId: "u1", body: "root" });
    if (!root.ok) return;
    const ok = await svc.createComment({ feedItemId: "fi-1", authorUserId: "u2", body: "reply", parentCommentId: root.value.comment.id });
    expect(ok.ok).toBe(true);
    const wrongThread = await svc.createComment({ feedItemId: "fi-OTHER", authorUserId: "u2", body: "x", parentCommentId: root.value.comment.id });
    expect(wrongThread.ok).toBe(false);
    if (wrongThread.ok) return;
    expect(wrongThread.error.code).toBe("PARENT_NOT_FOUND");
  });
});
