import { describe, expect, it } from "vitest";
import {
  createModerationService,
  createInMemoryModerationRepository,
  type ModerationActor,
  type CreateModerationReportInput,
} from "../public-api";
import { toUserId } from "@shared/contracts/branded-ids";

const reporter = toUserId("usr-reporter");
const moderatorId = toUserId("usr-moderator");
const adminId = toUserId("usr-admin");
const otherUser = toUserId("usr-other");

const actorUser: ModerationActor = { userId: reporter, role: "user" };
const actorAnon: ModerationActor = { userId: null, role: "user" };
const actorMod: ModerationActor = { userId: moderatorId, role: "moderator" };
const actorAdmin: ModerationActor = { userId: adminId, role: "admin" };

function makeInput(
  override: Partial<CreateModerationReportInput> = {},
): CreateModerationReportInput {
  return {
    reporterUserId: reporter,
    targetType: "friend_feed_post",
    targetId: "post-1",
    targetOwnerUserId: otherUser,
    reason: "spam",
    description: null,
    ...override,
  };
}

describe("moderation service — createReport", () => {
  it("rejects unauthenticated actors", async () => {
    const svc = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    const result = await svc.createReport(actorAnon, makeInput());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_AUTHORIZED");
  });

  it("rejects unknown target type", async () => {
    const svc = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    const result = await svc.createReport(
      actorUser,
      // intentionally bypass branded type for the test
      { ...makeInput(), targetType: "bogus" as never },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNKNOWN_TARGET_TYPE");
  });

  it("rejects unknown reason", async () => {
    const svc = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    const result = await svc.createReport(
      actorUser,
      { ...makeInput(), reason: "bogus" as never },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNKNOWN_REASON");
  });

  it("rejects self-reporting a profile target by default", async () => {
    const svc = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    const result = await svc.createReport(
      actorUser,
      makeInput({ targetType: "profile", targetId: reporter }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("SELF_REPORT_NOT_ALLOWED");
  });

  it("rejects empty description when reason requires it", async () => {
    const svc = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    const result = await svc.createReport(
      actorUser,
      makeInput({ reason: "impersonation", description: "" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INVALID_DESCRIPTION");
  });

  it("creates a report and returns the public status DTO without PII", async () => {
    const svc = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    const result = await svc.createReport(actorUser, makeInput());
    expect(result.ok).toBe(true);
    if (result.ok) {
      const dto = result.value;
      expect(dto.status).toBe("pending");
      expect(dto.targetType).toBe("friend_feed_post");
      expect(dto.reason).toBe("spam");
      // Public DTO must not leak reporter PII fields beyond own id reference.
      expect(Object.keys(dto)).toEqual(
        expect.arrayContaining([
          "id",
          "status",
          "targetType",
          "targetId",
          "reason",
          "createdAt",
        ]),
      );
      expect(Object.keys(dto)).not.toContain("description");
      expect(Object.keys(dto)).not.toContain("severity");
      expect(Object.keys(dto)).not.toContain("resolutionNote");
    }
  });

  it("blocks duplicate pending reports from same reporter on same target", async () => {
    const svc = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    const first = await svc.createReport(actorUser, makeInput());
    expect(first.ok).toBe(true);
    const second = await svc.createReport(actorUser, makeInput());
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.error.code).toBe("DUPLICATE_PENDING_REPORT");
    }
  });
});

describe("moderation service — review queue", () => {
  it("rejects normal users from listing the queue", async () => {
    const svc = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    await svc.createReport(actorUser, makeInput());
    const result = await svc.listForReview(actorUser, {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_AUTHORIZED");
  });

  it("returns the queue for moderators", async () => {
    const svc = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    await svc.createReport(actorUser, makeInput());
    const result = await svc.listForReview(actorMod, {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items.length).toBe(1);
    }
  });
});

describe("moderation service — apply action", () => {
  it("rejects normal users from taking actions", async () => {
    const svc = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    const created = await svc.createReport(actorUser, makeInput());
    if (!created.ok) throw new Error("setup failed");
    const result = await svc.applyReviewAction(actorUser, {
      reportId: created.value.id,
      actorModeratorUserId: reporter,
      actionType: "dismiss_report",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_AUTHORIZED");
  });

  it("dismisses a pending report and records the action", async () => {
    const svc = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    const created = await svc.createReport(actorUser, makeInput());
    if (!created.ok) throw new Error("setup failed");
    const result = await svc.applyReviewAction(actorMod, {
      reportId: created.value.id,
      actorModeratorUserId: moderatorId,
      actionType: "dismiss_report",
      reasonNote: "not a violation",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.report.status).toBe("dismissed");
      expect(result.value.action.actionType).toBe("dismiss_report");
      expect(result.value.report.reviewedByUserId).toBe(moderatorId);
    }
  });

  it("blocks an unsupported action for the target type", async () => {
    const svc = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    // profile target: canHide=false, canDeactivate=false, canRestore=false
    const created = await svc.createReport(
      actorUser,
      makeInput({ targetType: "profile", targetId: "profile-of-someone" }),
    );
    if (!created.ok) throw new Error("setup failed");
    const result = await svc.applyReviewAction(actorAdmin, {
      reportId: created.value.id,
      actorModeratorUserId: adminId,
      actionType: "hide_content",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ACTION_NOT_SUPPORTED_BY_TARGET");
    }
  });

  it("transitions report to action_taken on deactivate_content for friend_feed_post", async () => {
    const svc = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    const created = await svc.createReport(actorUser, makeInput());
    if (!created.ok) throw new Error("setup failed");
    const result = await svc.applyReviewAction(actorAdmin, {
      reportId: created.value.id,
      actorModeratorUserId: adminId,
      actionType: "deactivate_content",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.report.status).toBe("action_taken");
    }
  });
});

describe("moderation service — listMyReports", () => {
  it("returns only the reporter's own reports", async () => {
    const svc = createModerationService({
      repository: createInMemoryModerationRepository(),
    });
    await svc.createReport(actorUser, makeInput());
    await svc.createReport(
      { userId: otherUser, role: "user" },
      {
        ...makeInput(),
        reporterUserId: otherUser,
        targetId: "post-2",
      },
    );
    const mine = await svc.listMyReports(actorUser);
    expect(mine.ok).toBe(true);
    if (mine.ok) {
      expect(mine.value.length).toBe(1);
      expect(mine.value[0].targetId).toBe("post-1");
    }
  });
});
