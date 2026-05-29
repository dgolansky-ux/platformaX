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

  it("acceptJoinRequest adds the requester as an active member", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    const req = await svc.requestJoin(c.value.id, STRANGER);
    if (!req.ok) throw new Error("setup");
    const accepted = await svc.acceptJoinRequest({
      actorUserId: FOUNDER,
      communityId: c.value.id,
      joinRequestId: req.value.id,
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.value.status).toBe("accepted");
    const members = await svc.listMembers(c.value.id, FOUNDER);
    expect(members.ok).toBe(true);
    if (!members.ok) return;
    expect(members.value.find((m) => m.userId === STRANGER)?.role).toBe("member");
  });

  it("rejectJoinRequest does not add membership", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    const req = await svc.requestJoin(c.value.id, STRANGER);
    if (!req.ok) throw new Error("setup");
    const rejected = await svc.rejectJoinRequest({
      actorUserId: FOUNDER,
      communityId: c.value.id,
      joinRequestId: req.value.id,
    });
    expect(rejected.ok).toBe(true);
    if (!rejected.ok) return;
    expect(rejected.value.status).toBe("rejected");
    const members = await svc.listMembers(c.value.id, FOUNDER);
    expect(members.ok).toBe(true);
    if (!members.ok) return;
    expect(members.value.find((m) => m.userId === STRANGER)).toBeUndefined();
  });

  it("stranger cannot accept join request", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    const req = await svc.requestJoin(c.value.id, STRANGER);
    if (!req.ok) throw new Error("setup");
    const res = await svc.acceptJoinRequest({
      actorUserId: STRANGER,
      communityId: c.value.id,
      joinRequestId: req.value.id,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("changeMemberRole protects founder and rejects unauthorized callers", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    const req = await svc.requestJoin(c.value.id, STRANGER);
    if (!req.ok) throw new Error("setup");
    await svc.acceptJoinRequest({
      actorUserId: FOUNDER,
      communityId: c.value.id,
      joinRequestId: req.value.id,
    });
    const promoted = await svc.changeMemberRole({
      actorUserId: FOUNDER,
      communityId: c.value.id,
      targetUserId: STRANGER,
      nextRole: "moderator",
    });
    expect(promoted.ok).toBe(true);
    const blocked = await svc.changeMemberRole({
      actorUserId: STRANGER,
      communityId: c.value.id,
      targetUserId: FOUNDER,
      nextRole: "admin",
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.error.code === "FOUNDER_PROTECTED" || blocked.error.code === "FORBIDDEN").toBe(true);
    }
  });

  it("getPublicCommunityBySlug returns null for unknown slug", async () => {
    expect(await svc.getPublicCommunityBySlug("missing")).toBeNull();
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    const fetched = await svc.getPublicCommunityBySlug("devs");
    expect(fetched?.slug).toBe("devs");
    expect(fetched && "founderUserId" in fetched).toBe(false);
  });

  it("getViewerRole returns null for non-members and the role for members", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    const founderRole = await svc.getViewerRole(c.value.id, FOUNDER);
    expect(founderRole.ok && founderRole.value).toBe("founder");
    const strangerRole = await svc.getViewerRole(c.value.id, STRANGER);
    expect(strangerRole.ok && strangerRole.value).toBe(null);
  });

  it("listCategories returns the reference list sorted", () => {
    const list = svc.listCategories();
    expect(list.length).toBeGreaterThanOrEqual(12);
    const sorted = [...list].sort((a, b) => a.sortOrder - b.sortOrder);
    expect(list.map((c) => c.slug)).toEqual(sorted.map((c) => c.slug));
  });

  it("createCommunity stores categorySlug and listPublicCommunities filters by it", async () => {
    const a = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs", categorySlug: "technologia" });
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    expect(a.value.categorySlug).toBe("technologia");
    await svc.createCommunity({ founderUserId: FOUNDER, name: "Sport", slug: "sport", categorySlug: "sport" });
    const techOnly = await svc.listPublicCommunities(null, 50, "technologia");
    expect(techOnly.items.map((c) => c.slug)).toEqual(["devs"]);
  });

  it("createCommunity rejects unknown category", async () => {
    const res = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs", categorySlug: "casino" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("INVALID_CATEGORY");
  });

  it("listPendingJoinRequests is gated to founder/admin", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    await svc.requestJoin(c.value.id, STRANGER);
    const forFounder = await svc.listPendingJoinRequests(c.value.id, FOUNDER);
    expect(forFounder.ok).toBe(true);
    if (forFounder.ok) expect(forFounder.value.length).toBe(1);
    const forStranger = await svc.listPendingJoinRequests(c.value.id, STRANGER);
    expect(forStranger.ok).toBe(false);
    if (!forStranger.ok) expect(forStranger.error.code).toBe("FORBIDDEN");
  });
});
