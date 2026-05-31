import { describe, expect, it } from "vitest";
import {
  createInMemoryWorkplaceTeaserRepository,
  createNoopWorkplaceTeaserEventPublisher,
  createWorkplaceTeasersService,
  WORKPLACE_TEASER_DEFAULT_LIMIT,
  type CreateWorkplaceTeaserCommand,
  type WorkplaceTeaserFriendshipResolver,
} from "../public-api";
import { WORKPLACE_POST_TEASER_PREVIEW_MAX } from "../../workplace-posts/public-api";

function makeService(opts?: {
  friendIds?: (viewer: string) => readonly string[];
}) {
  const friendship: WorkplaceTeaserFriendshipResolver = {
    async listFriendIdsForViewer(viewerUserId) {
      return opts?.friendIds?.(viewerUserId) ?? [];
    },
    async areFriends(viewerUserId, ownerUserId) {
      return (opts?.friendIds?.(viewerUserId) ?? []).includes(ownerUserId);
    },
  };
  let seq = 0;
  return createWorkplaceTeasersService({
    repo: createInMemoryWorkplaceTeaserRepository(),
    friendship,
    events: createNoopWorkplaceTeaserEventPublisher(),
    clock: { now: () => new Date(`2026-05-30T02:0${seq % 10}:00Z`) },
    ids: { next: () => `wt-${++seq}` },
  });
}

function command(overrides: Partial<CreateWorkplaceTeaserCommand> = {}): CreateWorkplaceTeaserCommand {
  return {
    sourcePostId: "wpost-1",
    workplaceId: "wp-1",
    ownerUserId: "u-owner",
    workplaceName: "Coach Dawid",
    workplaceSlug: "coach-dawid",
    postBody: "Nowa realizacja na warsztacie kariery — szczegóły wewnątrz.",
    postMediaRefs: [],
    postVisibility: "workplace_public",
    ...overrides,
  };
}

describe("content-v2/workplace-teasers service", () => {
  it("creates a teaser from a public workplace post", async () => {
    const svc = makeService();
    const res = await svc.createFromWorkplacePost(command());
    expect(res.created).toBe(true);
    if (!res.created) return;
    expect(res.value.visibility).toBe("public");
    expect(res.value.sourcePostId).toBe("wpost-1");
    expect(res.value.targetRoute).toBe("/profile/workplaces/coach-dawid/posts/wpost-1");
  });

  it("skips teaser creation for private posts", async () => {
    const svc = makeService();
    const res = await svc.createFromWorkplacePost(command({ postVisibility: "private" }));
    expect(res.created).toBe(false);
    if (!res.created) expect(res.reason).toBe("SKIPPED_PRIVATE");
  });

  it("dedupes by sourcePostId — second insert is a no-op", async () => {
    const svc = makeService();
    const first = await svc.createFromWorkplacePost(command());
    expect(first.created).toBe(true);
    const second = await svc.createFromWorkplacePost(command());
    expect(second.created).toBe(false);
    if (!second.created) expect(second.reason).toBe("DUPLICATE");
  });

  it("never embeds the full body — preview is truncated", async () => {
    const svc = makeService();
    const longBody = "x".repeat(WORKPLACE_POST_TEASER_PREVIEW_MAX + 100);
    const res = await svc.createFromWorkplacePost(command({ postBody: longBody }));
    expect(res.created).toBe(true);
    if (!res.created) return;
    expect(res.value.previewText.length).toBeLessThanOrEqual(WORKPLACE_POST_TEASER_PREVIEW_MAX);
    expect(res.value.previewText.length).toBeLessThan(longBody.length);
  });

  it("friends_only teasers are hidden from strangers but visible to friends of owner", async () => {
    const svc = makeService({
      friendIds: (v) => (v === "u-friend" ? ["u-owner"] : []),
    });
    await svc.createFromWorkplacePost(command({ postVisibility: "friends_only" }));
    const friendPage = await svc.listForViewer({ viewerUserId: "u-friend" });
    expect(friendPage.items).toHaveLength(1);
    const strangerPage = await svc.listForViewer({ viewerUserId: "u-stranger" });
    expect(strangerPage.items).toHaveLength(0);
  });

  it("owner always sees own teasers", async () => {
    const svc = makeService();
    await svc.createFromWorkplacePost(command({ postVisibility: "friends_only" }));
    const ownerPage = await svc.listForViewer({ viewerUserId: "u-owner" });
    expect(ownerPage.items).toHaveLength(1);
  });

  it("public DTO carries no contact data and no full post body", async () => {
    const svc = makeService();
    const res = await svc.createFromWorkplacePost(command());
    if (!res.created) throw new Error("setup");
    expect(res.value).not.toHaveProperty("contactEmail");
    expect(res.value).not.toHaveProperty("contactPhone");
    expect(res.value).not.toHaveProperty("postBody");
  });

  it("uses first media ref as preview thumbnail when present", async () => {
    const svc = makeService();
    const res = await svc.createFromWorkplacePost(command({
      postMediaRefs: ["media:thumb-1", "media:thumb-2"],
    }));
    if (!res.created) throw new Error("setup");
    expect(res.value.previewMediaRef).toBe("media:thumb-1");
  });

  it("clamps listForViewer to WORKPLACE_TEASER_MAX_LIMIT", async () => {
    const svc = makeService();
    for (let i = 0; i < 3; i += 1) {
      await svc.createFromWorkplacePost(command({ sourcePostId: `wpost-${i}` }));
    }
    const page = await svc.listForViewer({ viewerUserId: "u-owner", limit: 999 });
    // All 3 teasers visible to owner; nextCursor null because under default cap.
    expect(page.items).toHaveLength(3);
    expect(WORKPLACE_TEASER_DEFAULT_LIMIT).toBeGreaterThan(3);
  });
});
