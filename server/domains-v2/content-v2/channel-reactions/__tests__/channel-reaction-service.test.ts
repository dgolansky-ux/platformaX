import { describe, expect, it } from "vitest";
import {
  createChannelReactionService,
  createInMemoryChannelReactionRepository,
  type ChannelReactionService,
} from "../public-api";

function makeService(): ChannelReactionService {
  let seq = 0;
  return createChannelReactionService({
    reactions: createInMemoryChannelReactionRepository(),
    clock: { now: () => new Date("2026-05-30T00:00:00Z") },
    ids: { next: () => `cr-${++seq}` },
  });
}

describe("content-v2/channel-reactions", () => {
  it("sets and removes a like reaction", async () => {
    const svc = makeService();
    const set = await svc.setReaction({ targetType: "channel_post", targetId: "post-1", userId: "u1", reactionType: "like" });
    expect(set.ok).toBe(true);
    if (set.ok) expect(set.value.created).toBe(true);
    const removed = await svc.removeReaction({ targetType: "channel_post", targetId: "post-1", userId: "u1", reactionType: "like" });
    expect(removed.ok).toBe(true);
    if (removed.ok) expect(removed.value.removed).toBe(true);
  });

  it("dedupes duplicate set and toggles consistently", async () => {
    const svc = makeService();
    await svc.setReaction({ targetType: "channel_post", targetId: "post-1", userId: "u1", reactionType: "like" });
    const duplicate = await svc.setReaction({ targetType: "channel_post", targetId: "post-1", userId: "u1", reactionType: "like" });
    expect(duplicate.ok).toBe(true);
    if (duplicate.ok) expect(duplicate.value.created).toBe(false);
    const off = await svc.toggleReaction({ targetType: "channel_post", targetId: "post-1", userId: "u1", reactionType: "like" });
    expect(off.ok).toBe(true);
    if (off.ok) expect(off.value.active).toBe(false);
    const on = await svc.toggleReaction({ targetType: "channel_post", targetId: "post-1", userId: "u1", reactionType: "like" });
    expect(on.ok).toBe(true);
    if (on.ok) expect(on.value.active).toBe(true);
  });

  it("returns batch counts and viewer state without PII", async () => {
    const svc = makeService();
    await svc.setReaction({ targetType: "channel_post", targetId: "post-1", userId: "u1", reactionType: "like" });
    await svc.setReaction({ targetType: "channel_post", targetId: "post-1", userId: "u2", reactionType: "like" });
    await svc.setReaction({ targetType: "channel_comment", targetId: "comment-1", userId: "u1", reactionType: "like" });
    const targets = [
      { targetType: "channel_post" as const, targetId: "post-1" },
      { targetType: "channel_comment" as const, targetId: "comment-1" },
    ];
    const summaries = await svc.getReactionSummaries({ targets });
    expect(summaries.summaries[0].counts.like).toBe(2);
    expect(summaries.summaries[1].counts.like).toBe(1);
    const viewer = await svc.getViewerReactionState({ userId: "u1", targets });
    expect(viewer.states[0].active).toEqual(["like"]);
    expect(JSON.stringify({ summaries, viewer })).not.toMatch(/email|phone|@/i);
  });
});
