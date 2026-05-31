import { beforeEach, describe, expect, it } from "vitest";
import {
  canRemoveMember,
  createCommunitiesService,
  createInMemoryCommunityRepository,
  createInMemoryInviteRepository,
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
    invites: createInMemoryInviteRepository(),
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

  it("joinCommunity adds the user to a public community", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    const joined = await svc.joinCommunity(c.value.id, STRANGER);
    expect(joined.ok).toBe(true);
    if (!joined.ok) return;
    expect(joined.value.role).toBe("member");
    const role = await svc.getViewerRole(c.value.id, STRANGER);
    expect(role.ok && role.value).toBe("member");
  });

  it("joinCommunity refuses private communities (must request)", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs", visibility: "private" });
    if (!c.ok) throw new Error("setup");
    const joined = await svc.joinCommunity(c.value.id, STRANGER);
    expect(joined.ok).toBe(false);
    if (!joined.ok) expect(joined.error.code).toBe("JOIN_REQUIRES_APPROVAL");
  });

  it("joinCommunity refuses an existing member", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    await svc.joinCommunity(c.value.id, STRANGER);
    const second = await svc.joinCommunity(c.value.id, STRANGER);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error.code).toBe("ALREADY_MEMBER");
  });

  it("cancelJoinRequest cancels only the requester's own pending request", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs", visibility: "private" });
    if (!c.ok) throw new Error("setup");
    const req = await svc.requestJoin(c.value.id, STRANGER);
    if (!req.ok) throw new Error("setup");

    const byFounder = await svc.cancelJoinRequest(c.value.id, req.value.id, FOUNDER);
    expect(byFounder.ok).toBe(false);
    if (!byFounder.ok) expect(byFounder.error.code).toBe("FORBIDDEN");

    const byOwner = await svc.cancelJoinRequest(c.value.id, req.value.id, STRANGER);
    expect(byOwner.ok).toBe(true);
    if (byOwner.ok) expect(byOwner.value.status).toBe("cancelled");

    const again = await svc.cancelJoinRequest(c.value.id, req.value.id, STRANGER);
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error.code).toBe("JOIN_REQUEST_NOT_PENDING");
  });

  it("leaveCommunity removes a regular member", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    await svc.joinCommunity(c.value.id, STRANGER);
    const left = await svc.leaveCommunity(c.value.id, STRANGER);
    expect(left.ok).toBe(true);
    const role = await svc.getViewerRole(c.value.id, STRANGER);
    expect(role.ok && role.value).toBeNull();
  });

  it("leaveCommunity refuses the sole founder", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    const res = await svc.leaveCommunity(c.value.id, FOUNDER);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FOUNDER_CANNOT_LEAVE");
  });

  it("leaveCommunity refuses a non-member", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    const res = await svc.leaveCommunity(c.value.id, STRANGER);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("NOT_MEMBER");
  });

  it("getViewerState describes stranger, member and founder relations", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    const stranger = await svc.getViewerState(c.value.id, STRANGER);
    expect(stranger.ok && stranger.value.relation).toBe("stranger");
    expect(stranger.ok && stranger.value.canJoin).toBe(true);
    expect(stranger.ok && stranger.value.canRequestJoin).toBe(false);

    const founder = await svc.getViewerState(c.value.id, FOUNDER);
    expect(founder.ok && founder.value.relation).toBe("founder");
    expect(founder.ok && founder.value.canManage).toBe(true);
    expect(founder.ok && founder.value.canLeave).toBe(true);

    await svc.joinCommunity(c.value.id, STRANGER);
    const member = await svc.getViewerState(c.value.id, STRANGER);
    expect(member.ok && member.value.relation).toBe("member");
    expect(member.ok && member.value.canLeave).toBe(true);
    expect(member.ok && member.value.canManage).toBe(false);
  });

  it("getViewerState describes pending_request and the cancel/can-request-join flags", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs", visibility: "private" });
    if (!c.ok) throw new Error("setup");
    const before = await svc.getViewerState(c.value.id, STRANGER);
    expect(before.ok && before.value.canRequestJoin).toBe(true);
    expect(before.ok && before.value.canViewPrivateSections).toBe(false);
    await svc.requestJoin(c.value.id, STRANGER);
    const pending = await svc.getViewerState(c.value.id, STRANGER);
    expect(pending.ok && pending.value.relation).toBe("pending_request");
    expect(pending.ok && pending.value.canCancelRequest).toBe(true);
    expect(pending.ok && pending.value.canRequestJoin).toBe(false);
  });

  it("getViewerState returns unauthenticated when viewer id is null", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs", visibility: "private" });
    if (!c.ok) throw new Error("setup");
    const anon = await svc.getViewerState(c.value.id, null);
    expect(anon.ok && anon.value.relation).toBe("unauthenticated");
    expect(anon.ok && anon.value.viewerUserId).toBeNull();
    expect(anon.ok && anon.value.canJoin).toBe(false);
    expect(anon.ok && anon.value.canViewPrivateSections).toBe(false);
  });

  it("getViewerState DTO carries no PII", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    const res = await svc.getViewerState(c.value.id, FOUNDER);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const keys = Object.keys(res.value);
    expect(keys).not.toContain("email");
    expect(keys).not.toContain("phone");
    expect(keys).not.toContain("dateOfBirth");
  });

  it("removeMember refuses self-removal and founder; allows admin to remove member", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    await svc.joinCommunity(c.value.id, STRANGER);
    await svc.changeMemberRole({
      actorUserId: FOUNDER,
      communityId: c.value.id,
      targetUserId: STRANGER,
      nextRole: "admin",
    });
    const adminUser = STRANGER;
    const targetUser = "u-target";
    await svc.joinCommunity(c.value.id, targetUser);

    // Admin can remove a member.
    const removed = await svc.removeMember({ actorUserId: adminUser, communityId: c.value.id, targetUserId: targetUser });
    expect(removed.ok).toBe(true);

    // Admin cannot remove the founder.
    const attackFounder = await svc.removeMember({ actorUserId: adminUser, communityId: c.value.id, targetUserId: FOUNDER });
    expect(attackFounder.ok).toBe(false);
    if (!attackFounder.ok) expect(attackFounder.error.code).toBe("FORBIDDEN");

    // Self-removal forbidden.
    const self = await svc.removeMember({ actorUserId: adminUser, communityId: c.value.id, targetUserId: adminUser });
    expect(self.ok).toBe(false);
    if (!self.ok) expect(self.error.code).toBe("FORBIDDEN");
  });

  it("removeMember refuses a member-acting-on-member", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    await svc.joinCommunity(c.value.id, STRANGER);
    await svc.joinCommunity(c.value.id, "u-other");
    const res = await svc.removeMember({ actorUserId: STRANGER, communityId: c.value.id, targetUserId: "u-other" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("createInvite requires founder/admin and a target", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");

    const blank = await svc.createInvite({ actorUserId: FOUNDER, communityId: c.value.id });
    expect(blank.ok).toBe(false);
    if (!blank.ok) expect(blank.error.code).toBe("INVITE_TARGET_REQUIRED");

    const byStranger = await svc.createInvite({
      actorUserId: STRANGER,
      communityId: c.value.id,
      invitedUserId: "u-want-in",
    });
    expect(byStranger.ok).toBe(false);
    if (!byStranger.ok) expect(byStranger.error.code).toBe("FORBIDDEN");

    const created = await svc.createInvite({
      actorUserId: FOUNDER,
      communityId: c.value.id,
      invitedUserId: "u-want-in",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.status).toBe("pending");
  });

  it("createInvite blocks duplicate pending for the same target", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    await svc.createInvite({ actorUserId: FOUNDER, communityId: c.value.id, invitedEmail: "x@example.com" });
    const dup = await svc.createInvite({ actorUserId: FOUNDER, communityId: c.value.id, invitedEmail: "x@example.com" });
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error.code).toBe("INVITE_DUPLICATE");
  });

  it("cancelInvite + listInvites round-trip; cancel of finalised invite blocked", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    const created = await svc.createInvite({ actorUserId: FOUNDER, communityId: c.value.id, invitedUserId: "u-1" });
    if (!created.ok) throw new Error("setup");

    const list1 = await svc.listInvitesForManage(c.value.id, FOUNDER);
    expect(list1.ok && list1.value.length).toBe(1);

    const cancelled = await svc.cancelInvite({ actorUserId: FOUNDER, communityId: c.value.id, inviteId: created.value.id });
    expect(cancelled.ok && cancelled.value.status).toBe("cancelled");

    const cancelAgain = await svc.cancelInvite({ actorUserId: FOUNDER, communityId: c.value.id, inviteId: created.value.id });
    expect(cancelAgain.ok).toBe(false);
    if (!cancelAgain.ok) expect(cancelAgain.error.code).toBe("INVITE_NOT_PENDING");
  });

  it("CommunityInvitePublicDTO carries no invitedEmail", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    await svc.createInvite({ actorUserId: FOUNDER, communityId: c.value.id, invitedEmail: "leak@example.com" });
    const publicList = await svc.listInvitesPublic(c.value.id);
    expect(publicList.ok).toBe(true);
    if (!publicList.ok) return;
    expect(publicList.value.length).toBe(1);
    const keys = Object.keys(publicList.value[0]);
    expect(keys).not.toContain("invitedEmail");
  });

  it("listInvitesForManage is gated to founder/admin and exposes invitedEmail for them only", async () => {
    const c = await svc.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!c.ok) throw new Error("setup");
    await svc.createInvite({ actorUserId: FOUNDER, communityId: c.value.id, invitedEmail: "leak@example.com" });

    const blocked = await svc.listInvitesForManage(c.value.id, STRANGER);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error.code).toBe("FORBIDDEN");

    const allowed = await svc.listInvitesForManage(c.value.id, FOUNDER);
    expect(allowed.ok && allowed.value[0].invitedEmail).toBe("leak@example.com");
  });
});
