import { describe, expect, it } from "vitest";
import { createCommunitiesService } from "../service";
import {
  createInMemoryCommunityRepository,
  createInMemoryHierarchyRepository,
  createInMemoryInviteRepository,
  createInMemoryJoinRequestRepository,
  createInMemoryMembershipRepository,
} from "../store";
import { createCommunityStructureService } from "../service-structure";

const FOUNDER = "u-founder";
const ADMIN = "u-admin";
const MEMBER = "u-member";
const OUTSIDER = "u-outsider";

function makeBundle() {
  const communities = createInMemoryCommunityRepository();
  const members = createInMemoryMembershipRepository();
  const joinRequests = createInMemoryJoinRequestRepository();
  const invites = createInMemoryInviteRepository();
  const hierarchy = createInMemoryHierarchyRepository();
  let seq = 0;
  const clock = { now: () => new Date("2026-05-29T10:00:00.000Z") };
  const ids = { next: () => `c-${++seq}` };
  const service = createCommunitiesService({ communities, members, joinRequests, invites, clock, ids });
  const structure = createCommunityStructureService({ communities, members, hierarchy, clock, ids });
  return { communities, members, hierarchy, service, structure };
}

async function setupRoot() {
  const b = makeBundle();
  const created = await b.service.createCommunity({
    founderUserId: FOUNDER,
    name: "Acme Root",
    slug: "acme-root",
    visibility: "public",
  });
  if (!created.ok) throw new Error("root creation failed");
  const rootId = created.value.id;
  await b.members.add({ communityId: rootId, userId: ADMIN, role: "admin", status: "active", joinedAt: "2026-05-29T10:00:00.000Z" });
  await b.members.add({ communityId: rootId, userId: MEMBER, role: "member", status: "active", joinedAt: "2026-05-29T10:00:00.000Z" });
  return { ...b, rootId };
}

describe("communities-v2 structure — create", () => {
  it("creates a subcommunity with parent/root/depth set and founder membership", async () => {
    const { structure, rootId, members } = await setupRoot();
    const res = await structure.createSubcommunity({
      actorUserId: FOUNDER,
      parentCommunityId: rootId,
      name: "Warszawa",
      slug: "acme-warszawa",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.parentCommunityId).toBe(rootId);
    expect(res.value.rootCommunityId).toBe(rootId);
    expect(res.value.depth).toBe(1);
    expect(res.value.status).toBe("active");
    const founderMembership = await members.get(res.value.id, FOUNDER);
    expect(founderMembership?.role).toBe("founder");
  });

  it("allows admin of the parent to create", async () => {
    const { structure, rootId } = await setupRoot();
    const res = await structure.createSubcommunity({
      actorUserId: ADMIN,
      parentCommunityId: rootId,
      name: "Kraków",
      slug: "acme-krakow",
    });
    expect(res.ok).toBe(true);
  });

  it("denies a plain member", async () => {
    const { structure, rootId } = await setupRoot();
    const res = await structure.createSubcommunity({
      actorUserId: MEMBER,
      parentCommunityId: rootId,
      name: "Nope",
      slug: "acme-nope",
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("FORBIDDEN");
  });

  it("denies an outsider", async () => {
    const { structure, rootId } = await setupRoot();
    const res = await structure.createSubcommunity({
      actorUserId: OUTSIDER,
      parentCommunityId: rootId,
      name: "Nope",
      slug: "acme-nope2",
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("FORBIDDEN");
  });

  it("rejects a duplicate slug", async () => {
    const { structure, rootId } = await setupRoot();
    await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "A", slug: "dup-slug" });
    const res = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "B", slug: "dup-slug" });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("SLUG_TAKEN");
  });

  it("enforces max depth (5 levels, depth 0..4)", async () => {
    const { structure, rootId } = await setupRoot();
    let parentId = rootId;
    for (let depth = 1; depth <= 4; depth++) {
      const r = await structure.createSubcommunity({
        actorUserId: FOUNDER,
        parentCommunityId: parentId,
        name: `L${depth}`,
        slug: `acme-l${depth}`,
      });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.value.depth).toBe(depth);
      parentId = r.value.id;
    }
    const tooDeep = await structure.createSubcommunity({
      actorUserId: FOUNDER,
      parentCommunityId: parentId,
      name: "L5",
      slug: "acme-l5",
    });
    expect(tooDeep.ok).toBe(false);
    if (tooDeep.ok) return;
    expect(tooDeep.error.code).toBe("MAX_DEPTH_EXCEEDED");
  });
});

describe("communities-v2 structure — read", () => {
  it("lists direct children", async () => {
    const { structure, rootId } = await setupRoot();
    await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "A", slug: "ch-a" });
    await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "B", slug: "ch-b" });
    const res = await structure.listSubcommunities(rootId, FOUNDER);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value).toHaveLength(2);
  });

  it("returns a structure with breadcrumbs and flat tree", async () => {
    const { structure, rootId } = await setupRoot();
    const wa = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "WA", slug: "br-wa" });
    if (!wa.ok) return;
    const it1 = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: wa.value.id, name: "IT", slug: "br-it" });
    if (!it1.ok) return;
    const res = await structure.getCommunityStructure(it1.value.id, FOUNDER);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.breadcrumbs.map((b) => b.slug)).toEqual(["acme-root", "br-wa", "br-it"]);
    expect(res.value.parent?.slug).toBe("br-wa");
    expect(res.value.root.slug).toBe("acme-root");
    // tree = root + 2 descendants
    expect(res.value.tree).toHaveLength(3);
    expect(res.value.maxDepth).toBe(4);
  });

  it("hides a private community's structure from strangers", async () => {
    const b = makeBundle();
    const created = await b.service.createCommunity({ founderUserId: FOUNDER, name: "Secret", slug: "secret", visibility: "private" });
    if (!created.ok) return;
    const res = await b.structure.getCommunityStructure(created.value.id, OUTSIDER);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("FORBIDDEN");
  });

  it("produces DTOs with no PII fields", async () => {
    const { structure, rootId } = await setupRoot();
    const sub = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "X", slug: "pii-x" });
    if (!sub.ok) return;
    const keys = Object.keys(sub.value).sort();
    expect(keys).toEqual(
      [
        "childCount", "depth", "description", "id", "memberCount", "name",
        "parentCommunityId", "rootCommunityId", "slug", "sortOrder", "status",
        "viewerRole", "visibility",
      ].sort(),
    );
    const serialized = JSON.stringify(sub.value);
    expect(serialized).not.toMatch(/email|phone|@/i);
  });
});

describe("communities-v2 structure — move", () => {
  it("moves a subcommunity under a new parent", async () => {
    const { structure, rootId } = await setupRoot();
    const a = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "A", slug: "mv-a" });
    const bc = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "B", slug: "mv-b" });
    if (!a.ok || !bc.ok) return;
    const res = await structure.moveSubcommunity({ actorUserId: FOUNDER, communityId: bc.value.id, newParentCommunityId: a.value.id });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.parentCommunityId).toBe(a.value.id);
    expect(res.value.depth).toBe(2);
  });

  it("blocks move-to-self", async () => {
    const { structure, rootId } = await setupRoot();
    const a = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "A", slug: "self-a" });
    if (!a.ok) return;
    const res = await structure.moveSubcommunity({ actorUserId: FOUNDER, communityId: a.value.id, newParentCommunityId: a.value.id });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("MOVE_TO_SELF");
  });

  it("blocks move under own descendant (cycle)", async () => {
    const { structure, rootId } = await setupRoot();
    const a = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "A", slug: "cyc-a" });
    if (!a.ok) return;
    const child = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: a.value.id, name: "A-child", slug: "cyc-a-child" });
    if (!child.ok) return;
    const res = await structure.moveSubcommunity({ actorUserId: FOUNDER, communityId: a.value.id, newParentCommunityId: child.value.id });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("MOVE_TO_DESCENDANT");
  });

  it("denies an unauthorized mover", async () => {
    const { structure, rootId } = await setupRoot();
    const a = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "A", slug: "auth-a" });
    const bc = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "B", slug: "auth-b" });
    if (!a.ok || !bc.ok) return;
    const res = await structure.moveSubcommunity({ actorUserId: MEMBER, communityId: bc.value.id, newParentCommunityId: a.value.id });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("FORBIDDEN");
  });

  it("recomputes depth of the whole moved subtree", async () => {
    const { structure, rootId } = await setupRoot();
    const a = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "A", slug: "st-a" });
    const bc = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "B", slug: "st-b" });
    if (!a.ok || !bc.ok) return;
    const bChild = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: bc.value.id, name: "B1", slug: "st-b1" });
    if (!bChild.ok) return;
    // move B (with child) under A: B depth 1→2, B1 depth 2→3
    const res = await structure.moveSubcommunity({ actorUserId: FOUNDER, communityId: bc.value.id, newParentCommunityId: a.value.id });
    expect(res.ok).toBe(true);
    const struct = await structure.getCommunityStructure(bChild.value.id, FOUNDER);
    if (!struct.ok) return;
    expect(struct.value.current.depth).toBe(3);
    expect(struct.value.breadcrumbs.map((x) => x.slug)).toEqual(["acme-root", "st-a", "st-b", "st-b1"]);
  });
});

describe("communities-v2 structure — deactivate / reactivate", () => {
  it("soft-deactivates and preserves membership/history", async () => {
    const { structure, rootId, members } = await setupRoot();
    const a = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "A", slug: "da-a" });
    if (!a.ok) return;
    const res = await structure.deactivateSubcommunity({ actorUserId: FOUNDER, communityId: a.value.id });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.status).toBe("deactivated");
    // founder membership still present (no hard delete)
    expect(await members.get(a.value.id, FOUNDER)).not.toBeNull();
    // community record still resolvable
    expect(await structure.getCommunityStructure(a.value.id, FOUNDER)).toBeTruthy();
  });

  it("blocks deactivation when active children exist", async () => {
    const { structure, rootId } = await setupRoot();
    const a = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "A", slug: "dc-a" });
    if (!a.ok) return;
    await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: a.value.id, name: "A1", slug: "dc-a1" });
    const res = await structure.deactivateSubcommunity({ actorUserId: FOUNDER, communityId: a.value.id });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("HAS_ACTIVE_CHILDREN");
  });

  it("reactivates a deactivated subcommunity", async () => {
    const { structure, rootId } = await setupRoot();
    const a = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "A", slug: "re-a" });
    if (!a.ok) return;
    await structure.deactivateSubcommunity({ actorUserId: FOUNDER, communityId: a.value.id });
    const res = await structure.reactivateSubcommunity({ actorUserId: FOUNDER, communityId: a.value.id });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.status).toBe("active");
  });

  it("never hard-deletes (root cannot be deactivated)", async () => {
    const { structure, rootId } = await setupRoot();
    const res = await structure.deactivateSubcommunity({ actorUserId: FOUNDER, communityId: rootId });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("NOT_A_SUBCOMMUNITY");
  });
});

describe("communities-v2 structure — staff", () => {
  it("lets the founder assign admins/moderators on a child", async () => {
    const { structure, rootId, members } = await setupRoot();
    const a = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "A", slug: "sf-a" });
    if (!a.ok) return;
    const res = await structure.assignSubcommunityStaff({
      actorUserId: FOUNDER,
      communityId: a.value.id,
      staff: [{ userId: MEMBER, role: "admin" }, { userId: ADMIN, role: "moderator" }],
    });
    expect(res.ok).toBe(true);
    expect((await members.get(a.value.id, MEMBER))?.role).toBe("admin");
    expect((await members.get(a.value.id, ADMIN))?.role).toBe("moderator");
  });

  it("forbids a plain member from assigning staff", async () => {
    const { structure, rootId } = await setupRoot();
    const a = await structure.createSubcommunity({ actorUserId: FOUNDER, parentCommunityId: rootId, name: "A", slug: "sf-b" });
    if (!a.ok) return;
    const res = await structure.assignSubcommunityStaff({
      actorUserId: MEMBER,
      communityId: a.value.id,
      staff: [{ userId: OUTSIDER, role: "admin" }],
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("FORBIDDEN");
  });
});
