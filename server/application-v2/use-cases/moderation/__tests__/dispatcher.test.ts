import { describe, expect, it } from "vitest";
import {
  createContentModerationDispatcher,
  type ContentDispatcherDeps,
} from "../dispatcher";
import type {
  ModerationDispatchContext,
} from "../service";

function makeContext(
  override: Partial<ModerationDispatchContext> = {},
): ModerationDispatchContext {
  return {
    targetType: "friend_feed_post",
    targetId: "post-1",
    actionType: "deactivate_content",
    moderatorUserId: "usr-mod",
    reasonNote: null,
    ...override,
  };
}

describe("createContentModerationDispatcher", () => {
  it("returns applied=false for unwired target types", async () => {
    const dispatcher = createContentModerationDispatcher({});
    const outcome = await dispatcher.dispatch(makeContext());
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.applied).toBe(false);
      expect(outcome.note).toContain("not wired");
    }
  });

  it("returns applied=false for non-content actions even when wired", async () => {
    const deps: ContentDispatcherDeps = {
      friendPosts: {
        moderatorDeactivatePost: async () => {
          throw new Error("should not be called");
        },
      } as unknown as ContentDispatcherDeps["friendPosts"],
    };
    const dispatcher = createContentModerationDispatcher(deps);
    const outcome = await dispatcher.dispatch(makeContext({ actionType: "dismiss_report" }));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.applied).toBe(false);
      expect(outcome.note).toContain("does not map");
    }
  });

  it("dispatches friend_feed_post deactivate to friend-posts moderator surface", async () => {
    const called: { friendPostId?: string; moderatorUserId?: string } = {};
    const deps: ContentDispatcherDeps = {
      friendPosts: {
        moderatorDeactivatePost: async (input: {
          friendPostId: string;
          moderatorUserId: string;
          reasonNote?: string | null;
        }) => {
          called.friendPostId = input.friendPostId;
          called.moderatorUserId = input.moderatorUserId;
          return { ok: true, value: { id: input.friendPostId } } as never;
        },
      } as unknown as ContentDispatcherDeps["friendPosts"],
    };
    const dispatcher = createContentModerationDispatcher(deps);
    const outcome = await dispatcher.dispatch(
      makeContext({
        targetType: "friend_feed_post",
        targetId: "post-42",
        moderatorUserId: "usr-mod",
      }),
    );
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.applied).toBe(true);
    expect(called.friendPostId).toBe("post-42");
    expect(called.moderatorUserId).toBe("usr-mod");
  });

  it("dispatches friend_feed_comment deactivate to friend-posts moderator surface", async () => {
    const deps: ContentDispatcherDeps = {
      friendPosts: {
        moderatorDeactivateComment: async (input: { commentId: string }) => {
          return { ok: true, value: { id: input.commentId } } as never;
        },
      } as unknown as ContentDispatcherDeps["friendPosts"],
    };
    const dispatcher = createContentModerationDispatcher(deps);
    const outcome = await dispatcher.dispatch(
      makeContext({ targetType: "friend_feed_comment", targetId: "cmt-1" }),
    );
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.applied).toBe(true);
  });

  it("propagates source-domain error as dispatcher failure", async () => {
    const deps: ContentDispatcherDeps = {
      friendPosts: {
        moderatorDeactivatePost: async () => ({
          ok: false,
          error: { code: "NOT_FOUND", message: "post not found" },
        }),
      } as unknown as ContentDispatcherDeps["friendPosts"],
    };
    const dispatcher = createContentModerationDispatcher(deps);
    const outcome = await dispatcher.dispatch(makeContext());
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.code).toBe("NOT_FOUND");
    }
  });
});
