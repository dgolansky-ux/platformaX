import { beforeEach, describe, expect, it } from "vitest";
import {
  createChannelsService,
  createInMemoryChannelRepository,
  createInMemoryFollowRepository,
  type ChannelsService,
  type CreateChannelInput,
} from "../public-api";

const COMMUNITY = "comm-1";

function makeService(): ChannelsService {
  let seq = 0;
  return createChannelsService({
    channels: createInMemoryChannelRepository(),
    follows: createInMemoryFollowRepository(),
    clock: { now: () => new Date("2026-05-29T00:00:00Z") },
    ids: { next: () => `ch-${++seq}` },
  });
}

const base: CreateChannelInput = { ownerType: "community", ownerId: COMMUNITY, slug: "news", name: "News" };

describe("channels service", () => {
  let svc: ChannelsService;
  beforeEach(() => {
    svc = makeService();
  });

  it("a channel requires a community owner", async () => {
    const res = await svc.createChannelForCommunity({ ...base, ownerId: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("MISSING_OWNER");
  });

  it("creates a channel and blocks a duplicate slug within the community", async () => {
    const ok = await svc.createChannelForCommunity(base);
    expect(ok.ok).toBe(true);
    const dup = await svc.createChannelForCommunity(base);
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error.code).toBe("SLUG_TAKEN");
  });

  it("follow is separate from membership; unfollow flips status; idempotent follow", async () => {
    const c = await svc.createChannelForCommunity(base);
    if (!c.ok) throw new Error("setup");
    await svc.followChannel(c.value.id, "u1");
    await svc.followChannel(c.value.id, "u1");
    let summary = await svc.getPublicSummary(c.value.id);
    expect(summary?.followerCount).toBe(1);
    await svc.unfollowChannel(c.value.id, "u1");
    summary = await svc.getPublicSummary(c.value.id);
    expect(summary?.followerCount).toBe(0);
  });

  it("public channel DTO carries no PII", async () => {
    const c = await svc.createChannelForCommunity(base);
    if (!c.ok) throw new Error("setup");
    const keys = Object.keys(c.value);
    expect(keys).not.toContain("email");
    expect(keys).not.toContain("phone");
    expect(c.value.ownerType).toBe("community");
  });

  it("listForCommunity paginates with a stable cursor", async () => {
    for (let i = 0; i < 3; i++) {
      await svc.createChannelForCommunity({ ...base, slug: `ch-${i}`, name: `C${i}` });
    }
    const page1 = await svc.listForCommunity(COMMUNITY, null, 2);
    expect(page1.items.length).toBe(2);
    expect(page1.nextCursor).not.toBeNull();
    const page2 = await svc.listForCommunity(COMMUNITY, page1.nextCursor, 2);
    expect(page2.items.length).toBe(1);
  });
});
