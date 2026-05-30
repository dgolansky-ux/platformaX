/**
 * application-v2/use-cases/publishing — dispatcher tests (Slice 17).
 *
 * Each per-target use-case is mocked: those use-cases are tested in their
 * own __tests__ folders. Here we only verify that the dispatcher routes
 * each `targetType` to the right one, packages results into the unified
 * envelope correctly, enforces idempotency, and returns truthful partial
 * envelopes for backend-not-ready targets.
 */
import { describe, expect, it } from "vitest";
import type { FriendFeedUseCaseV2 } from "../../friend-feed/public-api";
import type { CommunityFeedsUseCase } from "../../community-feeds/public-api";
import type { ChannelContentUseCase } from "../../channel-content/public-api";
import type { WorkplaceFeedUseCaseV2 } from "../../workplace-feed/public-api";
import { createPublishingService } from "../service";
import type { PublishingTargetRegistry } from "../registry";
import type {
  PublishingCommand,
  PublishingRequestContext,
} from "../contracts";

const VIEWER = "u-viewer";

function makeCtx(): PublishingRequestContext {
  return {
    viewerUserId: VIEWER,
    now: () => new Date("2026-05-30T12:00:00.000Z"),
  };
}

function emptyRegistry(): PublishingTargetRegistry {
  return {
    async getAvailablePublishingTargets() {
      return [];
    },
  };
}

interface Counters {
  friendFeedCalls: number;
  communityCalls: number;
  channelCalls: number;
  workplaceCalls: number;
}

function makeHarness(counters: Counters) {
  const friendFeed = {
    async createFriendFeedPost(input: { viewerUserId: string; body: string }) {
      counters.friendFeedCalls += 1;
      return {
        ok: true as const,
        value: {
          id: `fp-${counters.friendFeedCalls}`,
          authorUserId: input.viewerUserId,
          body: input.body,
          mediaRefs: [] as readonly string[],
          visibility: "friends_only" as const,
          status: "published" as const,
          createdAt: "2026-05-30T12:00:00.000Z",
          updatedAt: "2026-05-30T12:00:00.000Z",
        },
      };
    },
  } as unknown as FriendFeedUseCaseV2;

  const communityFeeds = {
    async publishCommunityPost(cmd: { actorUserId: string; communityId: string; body: string }) {
      counters.communityCalls += 1;
      return {
        ok: true as const,
        value: {
          post: { id: `cp-${counters.communityCalls}`, authorUserId: cmd.actorUserId, body: cmd.body },
          sourceItem: { id: "fi-1" },
          distributionId: null,
          distributedCount: 0,
          targetCommunityIds: [],
        },
      };
    },
  } as unknown as CommunityFeedsUseCase;

  const channelContent = {
    async createChannelPost(cmd: { channelId: string; actorUserId: string; body: string }) {
      counters.channelCalls += 1;
      return {
        ok: true as const,
        value: { id: `chp-${counters.channelCalls}`, channelId: cmd.channelId, authorUserId: cmd.actorUserId, body: cmd.body },
      };
    },
  } as unknown as ChannelContentUseCase;

  const workplaceFeed = {
    async createWorkplacePostWithFriendFeedTeaser(input: { viewerUserId: string; workplaceId: string; body: string }) {
      counters.workplaceCalls += 1;
      return {
        ok: true as const,
        value: {
          post: { post: { id: `wp-${counters.workplaceCalls}`, body: input.body, authorUserId: input.viewerUserId } },
          teaserCreated: true,
        },
      };
    },
  } as unknown as WorkplaceFeedUseCaseV2;

  const service = createPublishingService({
    registry: emptyRegistry(),
    friendFeed,
    communityFeeds,
    channelContent,
    workplaceFeed,
  });
  return service;
}

function command(over: Partial<PublishingCommand>): PublishingCommand {
  return {
    targetType: "friend_feed",
    contentType: "text_post",
    body: "Hello",
    visibility: "friends_only",
    idempotencyKey: "key-1",
    ...over,
  };
}

describe("publishing service — dispatcher", () => {
  it("routes friend_feed to friend-feed use-case", async () => {
    const counters: Counters = { friendFeedCalls: 0, communityCalls: 0, channelCalls: 0, workplaceCalls: 0 };
    const service = makeHarness(counters);
    const res = await service.publish(makeCtx(), command({ targetType: "friend_feed", visibility: "friends_only" }));
    expect(res.status).toBe("published");
    expect(counters.friendFeedCalls).toBe(1);
    expect(res.publishedEntity?.entityType).toBe("friend_post");
    expect(res.feedEffects.createdFriendFeedItem).toBe(true);
  });

  it("routes community_feed to community-feeds use-case", async () => {
    const counters: Counters = { friendFeedCalls: 0, communityCalls: 0, channelCalls: 0, workplaceCalls: 0 };
    const service = makeHarness(counters);
    const res = await service.publish(makeCtx(), command({
      targetType: "community_feed",
      targetId: "c-1",
      visibility: "community_all",
      idempotencyKey: "key-c-1",
    }));
    expect(res.status).toBe("published");
    expect(counters.communityCalls).toBe(1);
    expect(res.publishedEntity?.entityType).toBe("community_post");
  });

  it("routes community_staff_feed to community-feeds use-case (staff_only feedType)", async () => {
    const counters: Counters = { friendFeedCalls: 0, communityCalls: 0, channelCalls: 0, workplaceCalls: 0 };
    const service = makeHarness(counters);
    const res = await service.publish(makeCtx(), command({
      targetType: "community_staff_feed",
      targetId: "c-1",
      visibility: "community_staff",
      idempotencyKey: "key-s-1",
    }));
    expect(res.status).toBe("published");
    expect(counters.communityCalls).toBe(1);
  });

  it("routes community_relational_feed to community-feeds use-case", async () => {
    const counters: Counters = { friendFeedCalls: 0, communityCalls: 0, channelCalls: 0, workplaceCalls: 0 };
    const service = makeHarness(counters);
    const res = await service.publish(makeCtx(), command({
      targetType: "community_relational_feed",
      targetId: "c-1",
      visibility: "community_relational",
      idempotencyKey: "key-r-1",
    }));
    expect(res.status).toBe("published");
    expect(counters.communityCalls).toBe(1);
  });

  it("routes channel to channel-content use-case", async () => {
    const counters: Counters = { friendFeedCalls: 0, communityCalls: 0, channelCalls: 0, workplaceCalls: 0 };
    const service = makeHarness(counters);
    const res = await service.publish(makeCtx(), command({
      targetType: "channel",
      targetId: "ch-1",
      visibility: "channel_followers",
      idempotencyKey: "key-ch-1",
    }));
    expect(res.status).toBe("published");
    expect(counters.channelCalls).toBe(1);
    expect(res.publishedEntity?.entityType).toBe("channel_post");
  });

  it("routes workplace to workplace-feed use-case and reports teaser effect", async () => {
    const counters: Counters = { friendFeedCalls: 0, communityCalls: 0, channelCalls: 0, workplaceCalls: 0 };
    const service = makeHarness(counters);
    const res = await service.publish(makeCtx(), command({
      targetType: "workplace",
      targetId: "wp-1",
      visibility: "workplace_public",
      idempotencyKey: "key-wp-1",
    }));
    expect(res.status).toBe("published");
    expect(counters.workplaceCalls).toBe(1);
    expect(res.feedEffects.createdTeaser).toBe(true);
  });

  it("rejects empty body with EMPTY_BODY", async () => {
    const counters: Counters = { friendFeedCalls: 0, communityCalls: 0, channelCalls: 0, workplaceCalls: 0 };
    const service = makeHarness(counters);
    const res = await service.publish(makeCtx(), command({ body: "   ", idempotencyKey: "key-empty-1" }));
    expect(res.status).toBe("blocked");
    expect(res.errors[0]?.code).toBe("EMPTY_BODY");
  });

  it("rejects missing idempotencyKey", async () => {
    const counters: Counters = { friendFeedCalls: 0, communityCalls: 0, channelCalls: 0, workplaceCalls: 0 };
    const service = makeHarness(counters);
    const res = await service.publish(makeCtx(), command({ idempotencyKey: "  " }));
    expect(res.status).toBe("blocked");
    expect(res.errors[0]?.code).toBe("INTERNAL_ERROR");
  });

  it("important_event requires title and date — returns blocked when missing", async () => {
    const counters: Counters = { friendFeedCalls: 0, communityCalls: 0, channelCalls: 0, workplaceCalls: 0 };
    const service = makeHarness(counters);
    const res = await service.publish(makeCtx(), command({
      targetType: "important_event",
      contentType: "important_event",
      visibility: "public",
      idempotencyKey: "key-ie-noTitle",
    }));
    expect(res.status).toBe("blocked");
    expect(res.errors[0]?.code).toBe("TITLE_REQUIRED");
  });

  it("important_event with title+date returns truthful PARTIAL (no save)", async () => {
    const counters: Counters = { friendFeedCalls: 0, communityCalls: 0, channelCalls: 0, workplaceCalls: 0 };
    const service = makeHarness(counters);
    const res = await service.publish(makeCtx(), command({
      targetType: "important_event",
      contentType: "important_event",
      title: "Pierwszy występ",
      date: "2026-06-01T18:00:00.000Z",
      visibility: "public",
      idempotencyKey: "key-ie-1",
    }));
    expect(res.status).toBe("partial");
    expect(res.errors[0]?.code).toBe("TARGET_PARTIAL");
    expect(res.publishedEntity).toBeNull();
  });

  it("profile_presentation returns truthful PARTIAL (no save)", async () => {
    const counters: Counters = { friendFeedCalls: 0, communityCalls: 0, channelCalls: 0, workplaceCalls: 0 };
    const service = makeHarness(counters);
    const res = await service.publish(makeCtx(), command({
      targetType: "profile_presentation",
      contentType: "profile_presentation_item",
      visibility: "public",
      idempotencyKey: "key-pp-1",
    }));
    expect(res.status).toBe("partial");
    expect(res.errors[0]?.code).toBe("TARGET_PARTIAL");
  });

  it("idempotencyKey dedupes the same command", async () => {
    const counters: Counters = { friendFeedCalls: 0, communityCalls: 0, channelCalls: 0, workplaceCalls: 0 };
    const service = makeHarness(counters);
    const cmd = command({ idempotencyKey: "key-idem-1" });
    const a = await service.publish(makeCtx(), cmd);
    const b = await service.publish(makeCtx(), cmd);
    expect(a.status).toBe("published");
    expect(b.status).toBe("published");
    expect(counters.friendFeedCalls).toBe(1);
  });

  it("different idempotencyKey publishes twice", async () => {
    const counters: Counters = { friendFeedCalls: 0, communityCalls: 0, channelCalls: 0, workplaceCalls: 0 };
    const service = makeHarness(counters);
    await service.publish(makeCtx(), command({ idempotencyKey: "k-a" }));
    await service.publish(makeCtx(), command({ idempotencyKey: "k-b" }));
    expect(counters.friendFeedCalls).toBe(2);
  });

  it("PublishingResult envelope carries no PII / raw records", async () => {
    const counters: Counters = { friendFeedCalls: 0, communityCalls: 0, channelCalls: 0, workplaceCalls: 0 };
    const service = makeHarness(counters);
    const res = await service.publish(makeCtx(), command({ idempotencyKey: "k-noPII" }));
    const json = JSON.stringify(res);
    expect(json).not.toMatch(/email/i);
    expect(json).not.toMatch(/phone/i);
    expect(json).not.toMatch(/password/i);
    expect(json).not.toMatch(/data:image/);
  });
});
