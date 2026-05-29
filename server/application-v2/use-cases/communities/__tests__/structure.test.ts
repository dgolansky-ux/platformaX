import { describe, expect, it } from "vitest";
import {
  createCommunitiesService,
  createCommunityStructureService,
  createInMemoryCommunityRepository,
  createInMemoryHierarchyRepository,
  createInMemoryInviteRepository,
  createInMemoryJoinRequestRepository,
  createInMemoryMembershipRepository,
} from "@server/domains-v2/communities-v2/public-api";
import { createCommunityStructureUseCase } from "../structure";

const FOUNDER = "u-founder";
const MEMBER = "u-member";
const STAFF_A = "u-staff-a";
const STAFF_B = "u-staff-b";

async function setup() {
  const communities = createInMemoryCommunityRepository();
  const members = createInMemoryMembershipRepository();
  const joinRequests = createInMemoryJoinRequestRepository();
  const invites = createInMemoryInviteRepository();
  const hierarchy = createInMemoryHierarchyRepository();
  let seq = 0;
  const clock = { now: () => new Date("2026-05-29T10:00:00.000Z") };
  const ids = { next: () => `c-${++seq}` };
  const communitiesService = createCommunitiesService({ communities, members, joinRequests, invites, clock, ids });
  const structure = createCommunityStructureService({ communities, members, hierarchy, clock, ids });
  const useCase = createCommunityStructureUseCase({ communities: communitiesService, structure });

  const root = await communitiesService.createCommunity({
    founderUserId: FOUNDER,
    name: "Acme",
    slug: "acme",
    visibility: "public",
  });
  if (!root.ok) throw new Error("root failed");
  await members.add({ communityId: root.value.id, userId: MEMBER, role: "member", status: "active", joinedAt: "2026-05-29T10:00:00.000Z" });
  return { members, useCase, rootId: root.value.id };
}

describe("application-v2 communities structure use-case", () => {
  it("createSubcommunityWithStaff creates community + hierarchy + founder + staff roles", async () => {
    const { useCase, members, rootId } = await setup();
    const res = await useCase.createSubcommunityWithStaff({
      actorUserId: FOUNDER,
      parentCommunityId: rootId,
      name: "Warszawa",
      slug: "acme-wa",
      staff: [
        { userId: STAFF_A, role: "admin" },
        { userId: STAFF_B, role: "moderator" },
      ],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.parentCommunityId).toBe(rootId);
    expect(res.value.depth).toBe(1);
    expect((await members.get(res.value.id, FOUNDER))?.role).toBe("founder");
    expect((await members.get(res.value.id, STAFF_A))?.role).toBe("admin");
    expect((await members.get(res.value.id, STAFF_B))?.role).toBe("moderator");
  });

  it("createSubcommunityWithStaff works without staff", async () => {
    const { useCase, rootId } = await setup();
    const res = await useCase.createSubcommunityWithStaff({
      actorUserId: FOUNDER,
      parentCommunityId: rootId,
      name: "Solo",
      slug: "acme-solo",
    });
    expect(res.ok).toBe(true);
  });

  it("moveSubcommunitySafely blocks a cycle (move under own descendant)", async () => {
    const { useCase, rootId } = await setup();
    const a = await useCase.createSubcommunityWithStaff({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "A", slug: "mv-a" });
    if (!a.ok) return;
    const child = await useCase.createSubcommunityWithStaff({ actorUserId: FOUNDER, parentCommunityId: a.value.id, name: "A1", slug: "mv-a1" });
    if (!child.ok) return;
    const res = await useCase.moveSubcommunitySafely({ actorUserId: FOUNDER, communityId: a.value.id, newParentCommunityId: child.value.id });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("MOVE_TO_DESCENDANT");
  });

  it("getCommunityStructureView resolves by slug and returns a no-PII DTO", async () => {
    const { useCase, rootId } = await setup();
    await useCase.createSubcommunityWithStaff({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "Child", slug: "acme-child" });
    const res = await useCase.getCommunityStructureView("acme", FOUNDER);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.children).toHaveLength(1);
    expect(JSON.stringify(res.value)).not.toMatch(/email|phone|@/i);
  });

  it("does not bypass policy: a plain member cannot create a subcommunity", async () => {
    const { useCase, rootId } = await setup();
    const res = await useCase.createSubcommunityWithStaff({
      actorUserId: MEMBER,
      parentCommunityId: rootId,
      name: "Nope",
      slug: "acme-nope",
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("FORBIDDEN");
  });

  it("deactivateSubcommunitySafely soft-deactivates a leaf", async () => {
    const { useCase, rootId } = await setup();
    const a = await useCase.createSubcommunityWithStaff({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "A", slug: "da-a" });
    if (!a.ok) return;
    const res = await useCase.deactivateSubcommunitySafely({ actorUserId: FOUNDER, communityId: a.value.id });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.status).toBe("deactivated");
  });
});
