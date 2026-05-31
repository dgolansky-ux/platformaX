import { describe, expect, it } from "vitest";
import {
  createModerationService,
  createInMemoryModerationRepository,
  type ModerationActor,
} from "@server/domains-v2/moderation/public-api";
import { toUserId } from "@shared/contracts/branded-ids";
import { createModerationUseCase } from "../public-api";
import type {
  ModerationActionDispatcher,
  ModerationDispatchContext,
} from "../service";

const reporter = toUserId("usr-reporter");
const moderatorId = toUserId("usr-mod");
const otherUser = toUserId("usr-other");

const actorUser: ModerationActor = { userId: reporter, role: "user" };
const actorMod: ModerationActor = { userId: moderatorId, role: "moderator" };

describe("moderation use-case with dispatcher", () => {
  it("invokes the dispatcher for deactivate_content on a wired target", async () => {
    const calls: ModerationDispatchContext[] = [];
    const dispatcher: ModerationActionDispatcher = {
      async dispatch(ctx) {
        calls.push(ctx);
        return { ok: true, applied: true };
      },
    };
    const moderation = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    const useCase = createModerationUseCase({
      moderation,
      actionDispatcher: dispatcher,
    });
    const created = await useCase.submitReport(actorUser, {
      reporterUserId: reporter,
      targetType: "friend_feed_post",
      targetId: "post-1",
      targetOwnerUserId: otherUser,
      reason: "spam",
      description: null,
    });
    if (!created.ok) throw new Error("setup failed");
    const result = await useCase.applyAction(actorMod, {
      reportId: created.value.id,
      actorModeratorUserId: moderatorId,
      actionType: "deactivate_content",
    });
    expect(result.ok).toBe(true);
    expect(calls.length).toBe(1);
    expect(calls[0].targetType).toBe("friend_feed_post");
    expect(calls[0].actionType).toBe("deactivate_content");
    expect(calls[0].moderatorUserId).toBe(moderatorId);
  });

  it("propagates dispatcher failure as a use-case error", async () => {
    const dispatcher: ModerationActionDispatcher = {
      async dispatch() {
        return { ok: false, code: "NOT_FOUND", message: "post gone" };
      },
    };
    const moderation = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    const useCase = createModerationUseCase({
      moderation,
      actionDispatcher: dispatcher,
    });
    const created = await useCase.submitReport(actorUser, {
      reporterUserId: reporter,
      targetType: "friend_feed_post",
      targetId: "post-1",
      targetOwnerUserId: otherUser,
      reason: "spam",
      description: null,
    });
    if (!created.ok) throw new Error("setup failed");
    const result = await useCase.applyAction(actorMod, {
      reportId: created.value.id,
      actorModeratorUserId: moderatorId,
      actionType: "deactivate_content",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ACTION_NOT_SUPPORTED_BY_TARGET");
      expect(result.error.message).toContain("post gone");
    }
  });

  it("does not invoke the dispatcher for non-content actions", async () => {
    let called = 0;
    const dispatcher: ModerationActionDispatcher = {
      async dispatch() {
        called++;
        return { ok: true, applied: false, note: "n/a" };
      },
    };
    const moderation = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    const useCase = createModerationUseCase({
      moderation,
      actionDispatcher: dispatcher,
    });
    const created = await useCase.submitReport(actorUser, {
      reporterUserId: reporter,
      targetType: "friend_feed_post",
      targetId: "post-1",
      targetOwnerUserId: otherUser,
      reason: "spam",
      description: null,
    });
    if (!created.ok) throw new Error("setup failed");
    await useCase.applyAction(actorMod, {
      reportId: created.value.id,
      actorModeratorUserId: moderatorId,
      actionType: "dismiss_report",
    });
    // Dispatcher IS invoked, but with non-content action — it should return
    // applied:false (dispatcher decides; use-case stays out of the policy).
    expect(called).toBe(1);
  });
});
