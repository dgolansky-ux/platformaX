import { describe, expect, it } from "vitest";
import {
  createInMemoryTopicRepository,
  createTopicsService,
  type TopicModuleEnablementResolver,
  type TopicOwnershipResolver,
  type TopicsService,
} from "../public-api";

function makeService(opts?: {
  canManage?: (actor: string, ownerType: string, ownerId: string) => boolean;
  topicsEnabled?: boolean;
}): TopicsService {
  const canManage = opts?.canManage ?? (() => true);
  const ownership: TopicOwnershipResolver = {
    async canManageTopicsForOwner(actorUserId, ownerType, ownerId) {
      return canManage(actorUserId, ownerType, ownerId);
    },
  };
  const moduleEnablement: TopicModuleEnablementResolver = {
    async isTopicsEnabled() {
      return opts?.topicsEnabled ?? true;
    },
  };
  let seq = 0;
  return createTopicsService({
    topics: createInMemoryTopicRepository(),
    ownership,
    moduleEnablement,
    clock: { now: () => new Date("2026-05-30T00:00:00Z") },
    ids: { next: () => `topic-${++seq}` },
  });
}

describe("topics-v2 service", () => {
  it("profile owner can create a topic for their own profile", async () => {
    const svc = makeService();
    const res = await svc.createTopic({
      ownerType: "profile",
      ownerId: "u1",
      title: "Health",
      description: "Talks about health.",
      slug: "health",
      visibility: "public",
      createdByUserId: "u1",
    });
    expect(res.ok).toBe(true);
  });

  it("community admin can create a topic for the community", async () => {
    const svc = makeService();
    const res = await svc.createTopic({
      ownerType: "community",
      ownerId: "c1",
      title: "Onboarding",
      description: "How we onboard.",
      slug: "onboarding",
      visibility: "public",
      createdByUserId: "u-admin",
    });
    expect(res.ok).toBe(true);
  });

  it("forbids creation when ownership resolver denies", async () => {
    const svc = makeService({ canManage: () => false });
    const res = await svc.createTopic({
      ownerType: "community",
      ownerId: "c1",
      title: "Spam",
      description: "",
      slug: "spam",
      visibility: "public",
      createdByUserId: "u-evil",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("rejects empty title", async () => {
    const svc = makeService();
    const res = await svc.createTopic({
      ownerType: "profile",
      ownerId: "u1",
      title: "   ",
      description: "x",
      slug: "x",
      visibility: "public",
      createdByUserId: "u1",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("VALIDATION_FAILED");
      expect(res.error.message).toBe("TITLE_REQUIRED");
    }
  });

  it("rejects invalid slug", async () => {
    const svc = makeService();
    const res = await svc.createTopic({
      ownerType: "profile",
      ownerId: "u1",
      title: "Ok",
      description: "",
      slug: "Bad Slug!",
      visibility: "public",
      createdByUserId: "u1",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe("SLUG_INVALID");
  });

  it("blocks duplicate slug for same owner", async () => {
    const svc = makeService();
    await svc.createTopic({
      ownerType: "profile",
      ownerId: "u1",
      title: "T1",
      description: "",
      slug: "topic-a",
      visibility: "public",
      createdByUserId: "u1",
    });
    const dup = await svc.createTopic({
      ownerType: "profile",
      ownerId: "u1",
      title: "T2",
      description: "",
      slug: "topic-a",
      visibility: "public",
      createdByUserId: "u1",
    });
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error.code).toBe("SLUG_TAKEN");
  });

  it("listTopicsForOwner returns empty when module disabled", async () => {
    const svc = makeService({ topicsEnabled: false });
    await svc.createTopic({
      ownerType: "profile",
      ownerId: "u1",
      title: "T",
      description: "",
      slug: "t",
      visibility: "public",
      createdByUserId: "u1",
    });
    const list = await svc.listTopicsForOwner("profile", "u1");
    expect(list).toEqual([]);
  });

  it("getTopicPublicView returns MODULE_NOT_ENABLED when module disabled", async () => {
    const svc = makeService({ topicsEnabled: false });
    const created = await svc.createTopic({
      ownerType: "profile",
      ownerId: "u1",
      title: "T",
      description: "",
      slug: "t",
      visibility: "public",
      createdByUserId: "u1",
    });
    if (!created.ok) throw new Error("setup");
    const view = await svc.getTopicPublicView(created.value.id);
    expect(view.ok).toBe(false);
    if (!view.ok) expect(view.error.code).toBe("MODULE_NOT_ENABLED");
  });

  it("public DTO carries no createdByUserId", async () => {
    const svc = makeService();
    const created = await svc.createTopic({
      ownerType: "profile",
      ownerId: "u1",
      title: "T",
      description: "",
      slug: "t",
      visibility: "public",
      createdByUserId: "u1",
    });
    if (!created.ok) throw new Error("setup");
    const view = await svc.getTopicPublicView(created.value.id);
    expect(view.ok).toBe(true);
    if (!view.ok) return;
    expect(Object.keys(view.value)).not.toContain("createdByUserId");
  });

  it("archiveTopic flips status to archived", async () => {
    const svc = makeService();
    const created = await svc.createTopic({
      ownerType: "profile",
      ownerId: "u1",
      title: "T",
      description: "",
      slug: "t",
      visibility: "public",
      createdByUserId: "u1",
    });
    if (!created.ok) throw new Error("setup");
    const res = await svc.archiveTopic({ topicId: created.value.id, actorUserId: "u1" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.status).toBe("archived");
  });
});
