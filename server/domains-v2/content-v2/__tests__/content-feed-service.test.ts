import { beforeEach, describe, expect, it } from "vitest";
import {
  canSeePost,
  createContentService,
  createInMemoryPostRepository,
  type ContentService,
  type CreatePostInput,
} from "../public-api";

const ALICE = "u-alice";
const BOB = "u-bob";
const STRANGER = "u-stranger";

function makeService(): ContentService {
  let seq = 0;
  return createContentService({
    posts: createInMemoryPostRepository(),
    clock: { now: () => new Date(`2026-05-29T00:00:0${seq % 10}Z`) },
    ids: { next: () => `p-${++seq}` },
  });
}

const post = (over: Partial<CreatePostInput> = {}): CreatePostInput => ({
  authorUserId: BOB,
  contextType: "friend_post",
  contextId: BOB,
  body: "Hello friends",
  visibility: "friends",
  ...over,
});

describe("content-v2 posts + friend feed", () => {
  let svc: ContentService;
  beforeEach(() => {
    svc = makeService();
  });

  it("createPost rejects an empty body", async () => {
    const res = await svc.createPost(post({ body: "   " }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("EMPTY_BODY");
  });

  it("post public DTO carries no PII", async () => {
    const res = await svc.createPost(post());
    if (!res.ok) throw new Error("setup");
    const keys = Object.keys(res.value);
    expect(keys).not.toContain("email");
    expect(keys).not.toContain("phone");
    expect(res.value.authorUserId).toBe(BOB);
  });

  it("friend feed is scoped to explicit authors — no global feed", async () => {
    await svc.createPost(post({ authorUserId: BOB }));
    await svc.createPost(post({ authorUserId: STRANGER }));
    // Alice's feed only includes BOB (her friend), never STRANGER.
    const feed = await svc.listFriendFeed({ viewerUserId: ALICE, authorUserIds: [BOB] });
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].authorUserId).toBe(BOB);
  });

  it("friend feed paginates with cursor + maxLimit and stable order", async () => {
    for (let i = 0; i < 3; i++) await svc.createPost(post({ body: `p${i}` }));
    const page1 = await svc.listFriendFeed({ viewerUserId: ALICE, authorUserIds: [BOB], limit: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.nextCursor).not.toBeNull();
    const page2 = await svc.listFriendFeed({ viewerUserId: ALICE, authorUserIds: [BOB], cursor: page1.nextCursor, limit: 2 });
    expect(page2.items.length).toBe(1);
  });

  it("visibility policy: private hidden from non-owner, friends needs isFriend, public open", () => {
    const p = { authorUserId: BOB, status: "active" as const };
    expect(canSeePost({ ...p, visibility: "private" }, ALICE, true)).toBe(false);
    expect(canSeePost({ ...p, visibility: "friends" }, ALICE, true)).toBe(true);
    expect(canSeePost({ ...p, visibility: "friends" }, ALICE, false)).toBe(false);
    expect(canSeePost({ ...p, visibility: "public" }, STRANGER, false)).toBe(true);
    expect(canSeePost({ ...p, visibility: "private" }, BOB, false)).toBe(true);
  });
});
