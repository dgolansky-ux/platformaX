import { beforeEach, describe, expect, it } from "vitest";
import {
  canRemoveMember,
  createCommunitiesService,
  createInMemoryCommunityRepository,
  createInMemoryJoinRequestRepository,
  createInMemoryMembershipRepository,
  type CommunitiesService,
} from "../public-api";

const FOUNDER = "u-founder";
const STRANGER = "u-stranger";

function makeService(): { svc: CommunitiesService; members: ReturnType<typeof createInMemoryMembershipRepository> } {
  const members = createInMemoryMembershipRepository();
  let seq = 0;
  const svc = createCommunitiesService({
    communities: createInMemoryCommunityRepository(),
    members,
    joinRequests: createInMemoryJoinRequestRepository(),
    clock: { now: () => new Date("2026-05-29T00:00:00Z") },
    ids: { next: () => `c-${++seq}` },
  });
  return { svc, members };
}

describe("communities-v2 service", () => {
  let svc: CommunitiesService;
  beforeEach(() => {
    svc = makeService().svc;
  });

  it("createCommunity creates the founder membership", async () => {
    const res = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.memberCount).toBe(1);
    expect(await svc.canManageCommunity(res.value.id, FOUNDER)).toBe(true);
    expect(await svc.canManageCommunity(res.value.id, STRANGER)).toBe(false);
  });

  it("blocks an invalid and a duplicate slug", async () => {
    const bad = await svc.createCommunity({ founderUserId: FOUNDER, name: "X", slug: "Bad Slug!" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.code).toBe("INVALID_SLUG");
    await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    const dup = await svc.createCommunity({ founderUserId: STRANGER, name: "Devs2", slug: "devs" });
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error.code).toBe("SLUG_TAKEN");
  });

  it("public community DTO carries no PII / founder id", async () => {
    const res = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!res.ok) throw new Error("setup");
    const keys = Object.keys(res.value).sort();
    expect(keys).not.toContain("founderUserId");
    expect(keys).not.toContain("email");
    expect(keys).not.toContain("phone");
  });

  it("founder can never be removed; admin cannot remove founder", () => {
    expect(canRemoveMember({ role: "admin" }, { role: "founder" })).toBe(false);
    expect(canRemoveMember({ role: "founder" }, { role: "admin" })).toBe(true);
    expect(canRemoveMember({ role: "admin" }, { role: "member" })).toBe(true);
    expect(canRemoveMember({ role: "moderator" }, { role: "admin" })).toBe(false);
    expect(canRemoveMember({ role: "member" }, { role: "member" })).toBe(false);
  });

  it("stranger cannot update settings", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    const res = await svc.updateSettings({ actorUserId: STRANGER, communityId: c.value.id, name: "Hacked" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("requestJoin blocks duplicate pending", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    const first = await svc.requestJoin(c.value.id, STRANGER);
    expect(first.ok).toBe(true);
    const second = await svc.requestJoin(c.value.id, STRANGER);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error.code).toBe("JOIN_DUPLICATE");
  });

  it("listPublicCommunities paginates with a stable cursor", async () => {
    for (let i = 0; i < 3; i++) {
      await svc.createCommunity({ founderUserId: FOUNDER, name: `C${i}`, slug: `c-slug-${i}` });
    }
    const page1 = await svc.listPublicCommunities(null, 2);
    expect(page1.items.length).toBe(2);
    expect(page1.nextCursor).not.toBeNull();
    const page2 = await svc.listPublicCommunities(page1.nextCursor, 2);
    expect(page2.items.length).toBe(1);
  });
});
