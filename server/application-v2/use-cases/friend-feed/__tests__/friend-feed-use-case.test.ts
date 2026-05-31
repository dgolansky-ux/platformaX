import { describe, expect, it } from "vitest";
import { createFriendFeedUseCaseV2 } from "../public-api";
import {
  createFriendPostsService,
  createInMemoryFriendPostCommentRepository,
  createInMemoryFriendPostReactionRepository,
  createInMemoryFriendPostRepository,
  createNoopFriendFeedEventPublisher,
  type FriendshipResolver,
} from "@server/domains-v2/content-v2/public-api";
import type { SocialContactsService } from "@server/domains-v2/social/public-api";
import type { IdentityService } from "@server/domains-v2/identity/public-api";

type FriendId = string;

function socialStub(graph: Record<string, readonly FriendId[]>): SocialContactsService {
  return {
    async listFriends(ownerId: unknown) {
      const id = ownerId as string;
      const friends = graph[id] ?? [];
      return friends.map((f) => ({ ownerId: id as never, friendId: f as never, acceptedAt: "2026-01-01T00:00:00Z" }));
    },
  } as unknown as SocialContactsService;
}

function identityStub(profiles: Record<string, { displayName: string; slug: string | null }>): IdentityService {
  return {
    async getPublicProfile(_viewerId: string | null, profileUserId: string) {
      const p = profiles[profileUserId];
      if (!p) return { ok: false as const, error: { code: "NOT_FOUND", message: "x" } } as never;
      return {
        ok: true as const,
        value: {
          userId: profileUserId,
          profileSlug: p.slug,
          displayName: p.displayName,
          avatarMediaRef: null,
          bannerMediaRef: null,
          bio: null,
          location: null,
          civilStatus: null,
          socialLinks: null,
          personalStatus: null,
          visibility: "public",
          onboardingCompleted: true,
        },
      } as never;
    },
  } as unknown as IdentityService;
}

function makeFriendPosts(graph: Record<string, readonly FriendId[]>) {
  let seq = 0;
  const friendship: FriendshipResolver = {
    async areFriends(viewerUserId, authorUserId) {
      return (graph[viewerUserId] ?? []).includes(authorUserId);
    },
    async listFriendIdsForViewer(viewerUserId) {
      return graph[viewerUserId] ?? [];
    },
  };
  return createFriendPostsService({
    posts: createInMemoryFriendPostRepository(),
    comments: createInMemoryFriendPostCommentRepository(),
    reactions: createInMemoryFriendPostReactionRepository(),
    friendship,
    events: createNoopFriendFeedEventPublisher(),
    clock: { now: () => new Date(`2026-05-30T00:0${seq % 10}:00Z`) },
    ids: { next: () => `fp-${++seq}` },
  });
}

describe("friend-feed use-case v2", () => {
  it("friends_only visibility honors owner/friend/non-friend access", async () => {
    const graph: Record<string, readonly FriendId[]> = {
      "u-owner": ["u-friend"],
      "u-friend": ["u-owner"],
      "u-pending": [],
      "u-removed": [],
      "u-blocked": [],
    };
    const friendPosts = makeFriendPosts(graph);
    const created = await friendPosts.createPost({
      authorUserId: "u-owner",
      body: "friends only",
      visibility: "friends_only",
    });
    if (!created.ok) throw new Error("setup failed");

    const uc = createFriendFeedUseCaseV2({
      friendPosts,
      social: socialStub(graph),
      identity: identityStub({
        "u-owner": { displayName: "Owner", slug: "owner" },
        "u-friend": { displayName: "Friend", slug: "friend" },
      }),
    });

    const ownerPage = await uc.listFriendFeed({ viewerUserId: "u-owner" });
    const friendPage = await uc.listFriendFeed({ viewerUserId: "u-friend" });
    const pendingPage = await uc.listFriendFeed({ viewerUserId: "u-pending" });
    const removedPage = await uc.listFriendFeed({ viewerUserId: "u-removed" });
    const blockedPage = await uc.listFriendFeed({ viewerUserId: "u-blocked" });

    expect(ownerPage.items.some((i) => i.postId === created.value.id)).toBe(true);
    expect(friendPage.items.some((i) => i.postId === created.value.id)).toBe(true);
    expect(pendingPage.items.some((i) => i.postId === created.value.id)).toBe(false);
    expect(removedPage.items.some((i) => i.postId === created.value.id)).toBe(false);
    expect(blockedPage.items.some((i) => i.postId === created.value.id)).toBe(false);
  });

  it("listFriendFeed includes own + friends posts, excludes strangers, enriches author", async () => {
    const graph: Record<string, readonly FriendId[]> = {
      "u-viewer": ["u-friend"],
      "u-friend": ["u-viewer"],
    };
    const friendPosts = makeFriendPosts(graph);
    await friendPosts.createPost({ authorUserId: "u-viewer", body: "self post" });
    await friendPosts.createPost({ authorUserId: "u-friend", body: "from friend" });
    await friendPosts.createPost({ authorUserId: "u-stranger", body: "no" });

    const uc = createFriendFeedUseCaseV2({
      friendPosts,
      social: socialStub(graph),
      identity: identityStub({
        "u-viewer": { displayName: "Viewer", slug: "viewer" },
        "u-friend": { displayName: "Friend", slug: "friend" },
        "u-stranger": { displayName: "Stranger", slug: null },
      }),
    });
    const page = await uc.listFriendFeed({ viewerUserId: "u-viewer", limit: 10 });
    const authors = page.items.map((i) => i.author.userId).sort();
    expect(authors).toEqual(["u-friend", "u-viewer"]);
    expect(page.items.find((i) => i.author.userId === "u-friend")?.author.displayName).toBe("Friend");
  });

  it("profile preview as owner includes friends + private", async () => {
    const graph: Record<string, readonly FriendId[]> = { "u-owner": [] };
    const friendPosts = makeFriendPosts(graph);
    await friendPosts.createPost({ authorUserId: "u-owner", body: "p1", visibility: "friends_only" });
    await friendPosts.createPost({ authorUserId: "u-owner", body: "p2", visibility: "private" });
    const uc = createFriendFeedUseCaseV2({
      friendPosts,
      social: socialStub(graph),
      identity: identityStub({ "u-owner": { displayName: "Owner", slug: "owner" } }),
    });
    const view = await uc.getPersonalProfileFriendFeedPreview({
      viewerUserId: "u-owner",
      profileOwnerId: "u-owner",
    });
    expect(view.viewerRelation).toBe("owner");
    expect(view.items).toHaveLength(2);
  });

  it("profile preview as friend sees friends_only but not private", async () => {
    const graph: Record<string, readonly FriendId[]> = {
      "u-friend": ["u-owner"],
      "u-owner": ["u-friend"],
    };
    const friendPosts = makeFriendPosts(graph);
    await friendPosts.createPost({ authorUserId: "u-owner", body: "p1", visibility: "friends_only" });
    await friendPosts.createPost({ authorUserId: "u-owner", body: "p2", visibility: "private" });
    const uc = createFriendFeedUseCaseV2({
      friendPosts,
      social: socialStub(graph),
      identity: identityStub({
        "u-owner": { displayName: "Owner", slug: "owner" },
        "u-friend": { displayName: "Friend", slug: "friend" },
      }),
    });
    const view = await uc.getPersonalProfileFriendFeedPreview({
      viewerUserId: "u-friend",
      profileOwnerId: "u-owner",
    });
    expect(view.viewerRelation).toBe("friend");
    expect(view.items).toHaveLength(1);
    expect(view.items[0].body).toBe("p1");
  });

  it("profile preview as stranger is restricted (not_friends)", async () => {
    const graph: Record<string, readonly FriendId[]> = { "u-stranger": [], "u-owner": [] };
    const friendPosts = makeFriendPosts(graph);
    await friendPosts.createPost({ authorUserId: "u-owner", body: "p1", visibility: "friends_only" });
    const uc = createFriendFeedUseCaseV2({
      friendPosts,
      social: socialStub(graph),
      identity: identityStub({ "u-owner": { displayName: "Owner", slug: "owner" } }),
    });
    const view = await uc.getPersonalProfileFriendFeedPreview({
      viewerUserId: "u-stranger",
      profileOwnerId: "u-owner",
    });
    expect(view.viewerRelation).toBe("stranger");
    expect(view.items).toEqual([]);
    expect(view.restrictedReason).toBe("not_friends");
  });

  it("composer state reports no_friends when viewer has no friends", async () => {
    const graph: Record<string, readonly FriendId[]> = { "u-lonely": [] };
    const friendPosts = makeFriendPosts(graph);
    const uc = createFriendFeedUseCaseV2({
      friendPosts,
      social: socialStub(graph),
      identity: identityStub({}),
    });
    const state = await uc.getFriendFeedComposerState({ viewerUserId: "u-lonely" });
    expect(state.disabledReason).toBe("no_friends");
    expect(state.defaultVisibility).toBe("friends_only");
  });

  it("create then update then deactivate own post via use-case", async () => {
    const graph: Record<string, readonly FriendId[]> = { "u1": [] };
    const friendPosts = makeFriendPosts(graph);
    const uc = createFriendFeedUseCaseV2({
      friendPosts,
      social: socialStub(graph),
      identity: identityStub({ "u1": { displayName: "U1", slug: "u1" } }),
    });
    const created = await uc.createFriendFeedPost({ viewerUserId: "u1", body: "first" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const updated = await uc.updateOwnFriendPost({ viewerUserId: "u1", friendPostId: created.value.id, body: "second" });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.body).toBe("second");
    const deact = await uc.deactivateOwnFriendPost({ viewerUserId: "u1", friendPostId: created.value.id });
    expect(deact.ok).toBe(true);
    if (!deact.ok) return;
    expect(deact.value.status).toBe("deactivated");
  });

  it("feed view items have author summary with no PII keys", async () => {
    const graph: Record<string, readonly FriendId[]> = { "u-viewer": [] };
    const friendPosts = makeFriendPosts(graph);
    await friendPosts.createPost({ authorUserId: "u-viewer", body: "x" });
    const uc = createFriendFeedUseCaseV2({
      friendPosts,
      social: socialStub(graph),
      identity: identityStub({ "u-viewer": { displayName: "V", slug: "v" } }),
    });
    const page = await uc.listFriendFeed({ viewerUserId: "u-viewer" });
    const authorKeys = Object.keys(page.items[0].author);
    expect(authorKeys).not.toContain("email");
    expect(authorKeys).not.toContain("phone");
  });

  it("friend can create/list comments with public author summary", async () => {
    const graph: Record<string, readonly FriendId[]> = {
      "u-viewer": ["u-friend"],
      "u-friend": ["u-viewer"],
    };
    const friendPosts = makeFriendPosts(graph);
    const created = await friendPosts.createPost({ authorUserId: "u-friend", body: "post" });
    if (!created.ok) throw new Error("setup");
    const uc = createFriendFeedUseCaseV2({
      friendPosts,
      social: socialStub(graph),
      identity: identityStub({
        "u-viewer": { displayName: "Viewer", slug: "viewer" },
        "u-friend": { displayName: "Friend", slug: "friend" },
      }),
    });
    const comments = await uc.createFriendPostComment({
      viewerUserId: "u-viewer",
      friendPostId: created.value.id,
      body: "nice",
    });
    expect(comments.ok).toBe(true);
    if (!comments.ok) return;
    expect(comments.value.items[0].author.displayName).toBe("Viewer");
    expect(Object.keys(comments.value.items[0].author)).not.toContain("email");
  });

  it("stranger is denied comment and reaction orchestration", async () => {
    const graph: Record<string, readonly FriendId[]> = { "u-stranger": [], "u-author": [] };
    const friendPosts = makeFriendPosts(graph);
    const created = await friendPosts.createPost({ authorUserId: "u-author", body: "post" });
    if (!created.ok) throw new Error("setup");
    const uc = createFriendFeedUseCaseV2({
      friendPosts,
      social: socialStub(graph),
      identity: identityStub({ "u-author": { displayName: "Author", slug: "author" } }),
    });
    const comment = await uc.createFriendPostComment({
      viewerUserId: "u-stranger",
      friendPostId: created.value.id,
      body: "no",
    });
    expect(comment.ok).toBe(false);
    const reaction = await uc.reactToFriendPost({
      viewerUserId: "u-stranger",
      friendPostId: created.value.id,
      mode: "set",
    });
    expect(reaction.ok).toBe(false);
  });

  it("feed items include real interaction summary", async () => {
    const graph: Record<string, readonly FriendId[]> = {
      "u-viewer": ["u-friend"],
      "u-friend": ["u-viewer"],
    };
    const friendPosts = makeFriendPosts(graph);
    const created = await friendPosts.createPost({ authorUserId: "u-friend", body: "post" });
    if (!created.ok) throw new Error("setup");
    await friendPosts.createComment({ friendPostId: created.value.id, authorUserId: "u-viewer", body: "nice" });
    await friendPosts.toggleReaction({ friendPostId: created.value.id, actorUserId: "u-viewer", mode: "set" });
    const uc = createFriendFeedUseCaseV2({
      friendPosts,
      social: socialStub(graph),
      identity: identityStub({
        "u-viewer": { displayName: "Viewer", slug: "viewer" },
        "u-friend": { displayName: "Friend", slug: "friend" },
      }),
    });
    const page = await uc.listFriendFeed({ viewerUserId: "u-viewer" });
    expect(page.items[0].interactionSummary.commentCount).toBe(1);
    expect(page.items[0].interactionSummary.reactionSummary.likeCount).toBe(1);
    expect(page.items[0].interactionSummary.viewerReactionState.viewerLiked).toBe(true);
  });
});
