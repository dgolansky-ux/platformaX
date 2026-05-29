import { describe, expect, it } from "vitest";
import { createCommunityFeedService } from "../service";
import {
  createInMemoryCommunityFeedItemRepository,
  createInMemoryCommunityPostRepository,
} from "../store";

function makeService(now = "2026-05-29T10:00:00.000Z") {
  const posts = createInMemoryCommunityPostRepository();
  const items = createInMemoryCommunityFeedItemRepository();
  let seq = 0;
  const clock = { now: () => new Date(now) };
  const ids = { next: () => `x-${++seq}` };
  return createCommunityFeedService({ posts, items, clock, ids });
}

describe("content-v2 community-feeds service", () => {
  it("creates a post + source feed item", async () => {
    const svc = makeService();
    const res = await svc.createCommunityPost({
      authorUserId: "u1", publishedByUserId: "u1", body: "Hello", sourceCommunityId: "c1", feedType: "community_all",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.item.communityId).toBe("c1");
    expect(res.value.item.feedType).toBe("community_all");
    expect(res.value.item.isDistributed).toBe(false);
  });

  it("rejects an empty body", async () => {
    const svc = makeService();
    const res = await svc.createCommunityPost({ authorUserId: "u1", publishedByUserId: "u1", body: "  ", sourceCommunityId: "c1", feedType: "community_all" });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("EMPTY_BODY");
  });

  it("feed item DTO carries no PII", async () => {
    const svc = makeService();
    const res = await svc.createCommunityPost({ authorUserId: "u1", publishedByUserId: "u1", body: "Hi", sourceCommunityId: "c1", feedType: "community_all" });
    if (!res.ok) return;
    expect(JSON.stringify(res.value.item)).not.toMatch(/email|phone|@/i);
  });

  it("distributes to a descendant and marks it isDistributed", async () => {
    const svc = makeService();
    const created = await svc.createCommunityPost({ authorUserId: "u1", publishedByUserId: "u1", body: "Down", sourceCommunityId: "c1", feedType: "community_all", distributionId: "d1" });
    if (!created.ok) return;
    const dist = await svc.distributeCommunityPost({
      postId: created.value.post.id, authorUserId: "u1", publishedByUserId: "u1", body: "Down",
      targetCommunityId: "c2", feedType: "community_all", sourceCommunityId: "c1", distributionId: "d1",
    });
    expect(dist.ok).toBe(true);
    if (!dist.ok) return;
    expect(dist.value.communityId).toBe("c2");
    expect(dist.value.isDistributed).toBe(true);
    expect(dist.value.sourceCommunityId).toBe("c1");
  });

  it("blocks duplicate distribution to the same target/feed/distribution", async () => {
    const svc = makeService();
    const created = await svc.createCommunityPost({ authorUserId: "u1", publishedByUserId: "u1", body: "Down", sourceCommunityId: "c1", feedType: "community_all", distributionId: "d1" });
    if (!created.ok) return;
    const args = {
      postId: created.value.post.id, authorUserId: "u1", publishedByUserId: "u1", body: "Down",
      targetCommunityId: "c2", feedType: "community_all" as const, sourceCommunityId: "c1", distributionId: "d1",
    };
    const first = await svc.distributeCommunityPost(args);
    const second = await svc.distributeCommunityPost(args);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe("DUPLICATE");
  });

  it("lists a feed scoped to (community, feedType) with cursor + stable order", async () => {
    const posts = createInMemoryCommunityPostRepository();
    const items = createInMemoryCommunityFeedItemRepository();
    let seq = 0;
    let t = 0;
    const clock = { now: () => new Date(Date.UTC(2026, 4, 29, 10, 0, t++)) };
    const ids = { next: () => `x-${++seq}` };
    const svc = createCommunityFeedService({ posts, items, clock, ids });
    await svc.createCommunityPost({ authorUserId: "u1", publishedByUserId: "u1", body: "A", sourceCommunityId: "c1", feedType: "community_all" });
    await svc.createCommunityPost({ authorUserId: "u1", publishedByUserId: "u1", body: "B", sourceCommunityId: "c1", feedType: "community_all" });
    await svc.createCommunityPost({ authorUserId: "u1", publishedByUserId: "u1", body: "S", sourceCommunityId: "c1", feedType: "staff_only" });
    const page = await svc.listCommunityFeed({ communityId: "c1", feedType: "community_all", limit: 1 });
    expect(page.items).toHaveLength(1);
    expect(page.items[0].body).toBe("B"); // newest first
    expect(page.nextCursor).not.toBeNull();
    const page2 = await svc.listCommunityFeed({ communityId: "c1", feedType: "community_all", cursor: page.nextCursor, limit: 5 });
    expect(page2.items.map((i) => i.body)).toEqual(["A"]);
    // staff_only feed is separate
    const staff = await svc.listCommunityFeed({ communityId: "c1", feedType: "staff_only", limit: 5 });
    expect(staff.items.map((i) => i.body)).toEqual(["S"]);
  });

  it("counts relational posts per author per month", async () => {
    const svc = makeService("2026-05-29T10:00:00.000Z");
    await svc.createCommunityPost({ authorUserId: "u1", publishedByUserId: "u1", body: "R1", sourceCommunityId: "c1", feedType: "relational" });
    await svc.createCommunityPost({ authorUserId: "u1", publishedByUserId: "u1", body: "R2", sourceCommunityId: "c1", feedType: "relational" });
    await svc.createCommunityPost({ authorUserId: "u2", publishedByUserId: "u2", body: "R3", sourceCommunityId: "c1", feedType: "relational" });
    expect(await svc.countRelationalForAuthorMonth({ communityId: "c1", authorUserId: "u1", monthKey: "2026-05" })).toBe(2);
    expect(await svc.countRelationalForAuthorMonth({ communityId: "c1", authorUserId: "u1", monthKey: "2026-06" })).toBe(0);
  });
});
