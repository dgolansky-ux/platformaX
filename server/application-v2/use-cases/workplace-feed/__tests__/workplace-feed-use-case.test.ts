import { describe, expect, it } from "vitest";
import {
  createInMemoryWorkplacePostRepository,
  createInMemoryWorkplaceTeaserRepository,
  createNoopWorkplacePostEventPublisher,
  createNoopWorkplaceTeaserEventPublisher,
  createWorkplacePostsService,
  createWorkplaceTeasersService,
  type WorkplaceOwnershipResolver,
  type WorkplacePostFriendshipResolver,
  type WorkplaceTeaserFriendshipResolver,
} from "@server/domains-v2/content-v2/public-api";
import {
  createInMemoryWorkplaceRepository,
  createNoopWorkplaceEventPublisher,
  createWorkplacesService,
  type WorkplaceContactAccessResolver,
  type WorkplaceFriendshipResolver,
  type WorkplacesService,
} from "@server/domains-v2/identity/workplaces/public-api";
import type {
  IdentityService,
} from "@server/domains-v2/identity/public-api";
import type {
  SocialContactsService,
} from "@server/domains-v2/social/public-api";
import { createWorkplaceFeedUseCaseV2 } from "../public-api";

function makeIdentityStub(): IdentityService {
  // Minimal stub returning fake-but-PII-free public profiles. We cast the
  // rest of the unused IdentityService surface — tests only exercise
  // getPublicProfile here, and the cast is local to this fixture.
  const partial = {
    async getPublicProfile(viewerUserId: string, profileOwnerUserId: string) {
      void viewerUserId;
      return {
        ok: true as const,
        value: {
          userId: profileOwnerUserId,
          displayName: profileOwnerUserId === "u-owner" ? "Dawid" : "Inny",
          profileSlug: profileOwnerUserId === "u-owner" ? "dawid" : null,
          avatarMediaRef: null,
        },
      };
    },
  };
  return partial as unknown as IdentityService;
}

function makeSocialStub(friends: Record<string, readonly string[]>): SocialContactsService {
  const partial = {
    async listFriends(viewerUserId: unknown) {
      const list = friends[viewerUserId as string] ?? [];
      return list.map((id) => ({ friendId: id }));
    },
  };
  return partial as unknown as SocialContactsService;
}

function buildHarness(opts?: {
  friends?: Record<string, readonly string[]>;
}) {
  const friends = opts?.friends ?? { "u-friend": ["u-owner"] };

  const workplaceRepo = createInMemoryWorkplaceRepository();
  const workplaceFriendship: WorkplaceFriendshipResolver = {
    async areFriends(viewerUserId, ownerUserId) {
      return (friends[viewerUserId] ?? []).includes(ownerUserId);
    },
  };
  const workplaceContactAccess: WorkplaceContactAccessResolver = {
    async resolveVerdict(viewerUserId, ownerUserId) {
      if (viewerUserId === ownerUserId) return "owner";
      if ((friends[viewerUserId] ?? []).includes(ownerUserId)) return "friend";
      return "stranger";
    },
  };
  let wpSeq = 0;
  const workplaces: WorkplacesService = createWorkplacesService({
    repo: workplaceRepo,
    friendship: workplaceFriendship,
    contactAccess: workplaceContactAccess,
    events: createNoopWorkplaceEventPublisher(),
    clock: { now: () => new Date(`2026-05-30T03:0${wpSeq % 10}:00Z`) },
    ids: { next: () => `wp-${++wpSeq}` },
  });

  const postsRepo = createInMemoryWorkplacePostRepository();
  let postSeq = 0;
  const ownership: WorkplaceOwnershipResolver = {
    async isWorkplaceOwner(actor, workplaceId) {
      const wp = await workplaceRepo.getById(workplaceId);
      return !!wp && wp.ownerUserId === actor;
    },
    async getWorkplaceOwner(workplaceId) {
      const wp = await workplaceRepo.getById(workplaceId);
      return wp?.ownerUserId ?? null;
    },
  };
  const postFriendship: WorkplacePostFriendshipResolver = {
    async areFriends(v, o) {
      return (friends[v] ?? []).includes(o);
    },
  };
  const workplacePosts = createWorkplacePostsService({
    posts: postsRepo,
    ownership,
    friendship: postFriendship,
    events: createNoopWorkplacePostEventPublisher(),
    clock: { now: () => new Date(`2026-05-30T04:0${postSeq % 10}:00Z`) },
    ids: { next: () => `wpost-${++postSeq}` },
  });

  let teaserSeq = 0;
  const teaserFriendship: WorkplaceTeaserFriendshipResolver = {
    async listFriendIdsForViewer(viewerUserId) {
      return friends[viewerUserId] ?? [];
    },
    async areFriends(v, o) {
      return (friends[v] ?? []).includes(o);
    },
  };
  const workplaceTeasers = createWorkplaceTeasersService({
    repo: createInMemoryWorkplaceTeaserRepository(),
    friendship: teaserFriendship,
    events: createNoopWorkplaceTeaserEventPublisher(),
    clock: { now: () => new Date(`2026-05-30T05:0${teaserSeq % 10}:00Z`) },
    ids: { next: () => `wt-${++teaserSeq}` },
  });

  const useCase = createWorkplaceFeedUseCaseV2({
    workplaces,
    workplacePosts,
    workplaceTeasers,
    identity: makeIdentityStub(),
    social: makeSocialStub(friends),
  });

  return { useCase, workplaces, workplacePosts, workplaceTeasers };
}

describe("workplace-feed use-case", () => {
  it("creates a workplace via the viewer-scoped wrapper", async () => {
    const { useCase } = buildHarness();
    const res = await useCase.createWorkplaceForViewer({
      viewerUserId: "u-owner",
      command: {
        name: "Coach Dawid",
        slug: "coach-dawid",
        headline: "Coaching",
        description: "Pomoc w karierze.",
      },
    });
    expect(res.ok).toBe(true);
  });

  it("publishes a workplace post and creates a friend-feed teaser", async () => {
    const { useCase } = buildHarness();
    const wp = await useCase.createWorkplaceForViewer({
      viewerUserId: "u-owner",
      command: { name: "WP", slug: "wp", headline: "", description: "" },
    });
    if (!wp.ok) throw new Error("setup");

    const post = await useCase.createWorkplacePostWithFriendFeedTeaser({
      viewerUserId: "u-owner",
      workplaceId: wp.value.id,
      body: "Nowa realizacja na warsztacie.",
    });
    expect(post.ok).toBe(true);
    if (!post.ok) return;
    expect(post.value.teaserCreated).toBe(true);
    expect(post.value.post.post.body).toBe("Nowa realizacja na warsztacie.");
    expect(post.value.post.author.userId).toBe("u-owner");
  });

  it("does not create a teaser for a private workplace post", async () => {
    const { useCase } = buildHarness();
    const wp = await useCase.createWorkplaceForViewer({
      viewerUserId: "u-owner",
      command: { name: "WP", slug: "wp", headline: "", description: "" },
    });
    if (!wp.ok) throw new Error("setup");
    const post = await useCase.createWorkplacePostWithFriendFeedTeaser({
      viewerUserId: "u-owner",
      workplaceId: wp.value.id,
      body: "Notatka tylko dla mnie.",
      visibility: "private",
    });
    if (!post.ok) throw new Error("publish");
    expect(post.value.teaserCreated).toBe(false);
  });

  it("forbids non-owner from publishing in the workplace micro-feed", async () => {
    const { useCase } = buildHarness();
    const wp = await useCase.createWorkplaceForViewer({
      viewerUserId: "u-owner",
      command: { name: "WP", slug: "wp", headline: "", description: "" },
    });
    if (!wp.ok) throw new Error("setup");
    const post = await useCase.createWorkplacePostWithFriendFeedTeaser({
      viewerUserId: "u-friend",
      workplaceId: wp.value.id,
      body: "Spam",
    });
    expect(post.ok).toBe(false);
    if (!post.ok) expect(post.error.code).toBe("FORBIDDEN");
  });

  it("friend sees friend's teaser on the friend feed; stranger does not", async () => {
    const { useCase } = buildHarness();
    const wp = await useCase.createWorkplaceForViewer({
      viewerUserId: "u-owner",
      command: { name: "WP", slug: "wp", headline: "", description: "" },
    });
    if (!wp.ok) throw new Error("setup");
    await useCase.createWorkplacePostWithFriendFeedTeaser({
      viewerUserId: "u-owner",
      workplaceId: wp.value.id,
      body: "Aktualizacja zawodowa.",
      visibility: "friends_only",
    });

    const friendFeed = await useCase.listFriendFeedWorkplaceTeasers({ viewerUserId: "u-friend" });
    expect(friendFeed.items).toHaveLength(1);
    expect(friendFeed.items[0].teaser.targetRoute).toBe("/profile/workplaces/wp/posts/wpost-1");
    expect(friendFeed.items[0].owner.userId).toBe("u-owner");

    const strangerFeed = await useCase.listFriendFeedWorkplaceTeasers({ viewerUserId: "u-stranger" });
    expect(strangerFeed.items).toHaveLength(0);
  });

  it("getWorkplacePageView returns workplace + owner + contact + viewer state", async () => {
    const { useCase } = buildHarness();
    const wp = await useCase.createWorkplaceForViewer({
      viewerUserId: "u-owner",
      command: {
        name: "WP",
        slug: "wp",
        headline: "",
        description: "",
        contactEmail: "owner@example.com",
        contactVisibility: "friends",
      },
    });
    if (!wp.ok) throw new Error("setup");

    const ownerView = await useCase.getWorkplacePageView({
      viewerUserId: "u-owner",
      workplaceId: wp.value.id,
    });
    expect(ownerView.ok).toBe(true);
    if (!ownerView.ok) return;
    expect(ownerView.value.viewerState.isOwner).toBe(true);
    expect(ownerView.value.contact.contactEmail).toBe("owner@example.com");

    const strangerView = await useCase.getWorkplacePageView({
      viewerUserId: "u-stranger",
      workplaceId: wp.value.id,
    });
    expect(strangerView.ok).toBe(true);
    if (!strangerView.ok) return;
    expect(strangerView.value.viewerState.isOwner).toBe(false);
    expect(strangerView.value.contact.contactEmail).toBeNull();
  });

  it("professional layer enumerates owner's workplaces with relation flags", async () => {
    const { useCase } = buildHarness();
    await useCase.createWorkplaceForViewer({
      viewerUserId: "u-owner",
      command: { name: "WP One", slug: "wp-one", headline: "", description: "" },
    });
    await useCase.createWorkplaceForViewer({
      viewerUserId: "u-owner",
      command: { name: "WP Two", slug: "wp-two", headline: "", description: "" },
    });
    const ownerLayer = await useCase.listProfessionalLayer({
      viewerUserId: "u-owner",
      profileOwnerId: "u-owner",
    });
    expect(ownerLayer.viewerRelation).toBe("owner");
    expect(ownerLayer.canAddWorkplace).toBe(true);
    expect(ownerLayer.workplaces).toHaveLength(2);

    const friendLayer = await useCase.listProfessionalLayer({
      viewerUserId: "u-friend",
      profileOwnerId: "u-owner",
    });
    expect(friendLayer.viewerRelation).toBe("friend");
    expect(friendLayer.canAddWorkplace).toBe(false);
  });
});
