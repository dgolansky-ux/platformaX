import { describe, expect, it } from "vitest";
import { createReactionService } from "../service";
import { createInMemoryReactionRepository } from "../store";

function makeService(now = "2026-05-29T10:00:00.000Z") {
  const repo = createInMemoryReactionRepository();
  let seq = 0;
  const clock = { now: () => new Date(now) };
  const ids = { next: () => `r-${++seq}` };
  return createReactionService({ repo, clock, ids });
}

describe("content-v2 reactions service", () => {
  it("sets a reaction on a post-target feed item", async () => {
    const svc = makeService();
    const res = await svc.setReaction({ targetType: "post", targetId: "fi-1", userId: "u1", reactionType: "like" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.created).toBe(true);
    expect(res.value.reaction.reactionType).toBe("like");
  });

  it("setReaction is idempotent for the same (target, user, type) — no duplicates", async () => {
    const svc = makeService();
    const first = await svc.setReaction({ targetType: "post", targetId: "fi-1", userId: "u1", reactionType: "like" });
    const second = await svc.setReaction({ targetType: "post", targetId: "fi-1", userId: "u1", reactionType: "like" });
    expect(first.ok && second.ok).toBe(true);
    if (first.ok) expect(first.value.created).toBe(true);
    if (second.ok) expect(second.value.created).toBe(false);
    const s = await svc.getReactionSummaries({ targets: [{ targetType: "post", targetId: "fi-1" }] });
    expect(s.summaries[0].counts.like).toBe(1);
  });

  it("removeReaction removes only the matching tuple, idempotent if absent", async () => {
    const svc = makeService();
    await svc.setReaction({ targetType: "post", targetId: "fi-1", userId: "u1", reactionType: "like" });
    const r1 = await svc.removeReaction({ targetType: "post", targetId: "fi-1", userId: "u1", reactionType: "like" });
    const r2 = await svc.removeReaction({ targetType: "post", targetId: "fi-1", userId: "u1", reactionType: "like" });
    if (!r1.ok || !r2.ok) return;
    expect(r1.value.removed).toBe(true);
    expect(r2.value.removed).toBe(false);
  });

  it("toggleReaction flips state in one call", async () => {
    const svc = makeService();
    const on = await svc.toggleReaction({ targetType: "post", targetId: "fi-1", userId: "u1", reactionType: "like" });
    expect(on.ok && on.value.active).toBe(true);
    const off = await svc.toggleReaction({ targetType: "post", targetId: "fi-1", userId: "u1", reactionType: "like" });
    expect(off.ok && off.value.active).toBe(false);
    if (off.ok) expect(off.value.reaction).toBeNull();
  });

  it("batch counts for several targets in one call (no N+1)", async () => {
    const svc = makeService();
    await svc.setReaction({ targetType: "post", targetId: "fi-1", userId: "u1", reactionType: "like" });
    await svc.setReaction({ targetType: "post", targetId: "fi-1", userId: "u2", reactionType: "like" });
    await svc.setReaction({ targetType: "post", targetId: "fi-2", userId: "u1", reactionType: "like" });
    await svc.setReaction({ targetType: "comment", targetId: "c-1", userId: "u1", reactionType: "like" });
    const res = await svc.getReactionSummaries({
      targets: [
        { targetType: "post", targetId: "fi-1" },
        { targetType: "post", targetId: "fi-2" },
        { targetType: "comment", targetId: "c-1" },
        { targetType: "post", targetId: "fi-missing" },
      ],
    });
    const map = new Map(res.summaries.map((s) => [`${s.targetType}|${s.targetId}`, s]));
    expect(map.get("post|fi-1")?.counts.like).toBe(2);
    expect(map.get("post|fi-2")?.counts.like).toBe(1);
    expect(map.get("comment|c-1")?.counts.like).toBe(1);
    expect(map.get("post|fi-missing")?.counts.like).toBe(0);
    expect(map.get("post|fi-missing")?.total).toBe(0);
  });

  it("viewer state returns only viewer's active reactions per target", async () => {
    const svc = makeService();
    await svc.setReaction({ targetType: "post", targetId: "fi-1", userId: "u1", reactionType: "like" });
    await svc.setReaction({ targetType: "post", targetId: "fi-1", userId: "u2", reactionType: "like" });
    const u1 = await svc.getViewerReactionState({
      userId: "u1",
      targets: [
        { targetType: "post", targetId: "fi-1" },
        { targetType: "post", targetId: "fi-2" },
      ],
    });
    expect(u1.states[0].active).toEqual(["like"]);
    expect(u1.states[1].active).toEqual([]);
    const u3 = await svc.getViewerReactionState({ userId: "u3", targets: [{ targetType: "post", targetId: "fi-1" }] });
    expect(u3.states[0].active).toEqual([]);
  });

  it("reaction DTO carries no PII", async () => {
    const svc = makeService();
    const res = await svc.setReaction({ targetType: "post", targetId: "fi-1", userId: "u1", reactionType: "like" });
    if (!res.ok) return;
    const sum = await svc.getReactionSummaries({ targets: [{ targetType: "post", targetId: "fi-1" }] });
    expect(JSON.stringify({ res: res.value, sum })).not.toMatch(/email|phone|@/i);
  });
});
