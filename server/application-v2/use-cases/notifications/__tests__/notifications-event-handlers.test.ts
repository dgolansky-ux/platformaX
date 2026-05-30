import { describe, expect, it } from "vitest";
import type {
  FriendFeedCommentCreatedEvent,
  FriendFeedCommentReactionAddedEvent,
  FriendFeedReactionAddedEvent,
} from "@server/domains-v2/content-v2/public-api";
import {
  createInMemoryNotificationRepository,
  createInMemoryNotificationSettingsRepository,
  createNotificationsService,
  type NotificationsService,
} from "@server/domains-v2/notifications-v2/public-api";
import { createNotificationOrchestrator } from "../public-api";

function makeStack(): { svc: NotificationsService; orch: ReturnType<typeof createNotificationOrchestrator> } {
  let seq = 0;
  const svc = createNotificationsService({
    notifications: createInMemoryNotificationRepository(),
    settings: createInMemoryNotificationSettingsRepository(),
    clock: { now: () => new Date(`2026-05-30T11:${String(seq % 60).padStart(2, "0")}:00Z`) },
    ids: { next: () => `notif-${++seq}` },
  });
  const orch = createNotificationOrchestrator({ notifications: svc });
  return { svc, orch };
}

function commentEvent(overrides: Partial<FriendFeedCommentCreatedEvent> = {}): FriendFeedCommentCreatedEvent {
  return {
    type: "FriendFeedCommentCreated",
    eventId: "evt-1",
    actorUserId: "u-bob",
    recipientUserId: "u-alice",
    postId: "fp-1",
    commentId: "fpc-1",
    occurredAt: "2026-05-30T11:00:00Z",
    correlationId: null,
    ...overrides,
  };
}

function reactionEvent(overrides: Partial<FriendFeedReactionAddedEvent> = {}): FriendFeedReactionAddedEvent {
  return {
    type: "FriendFeedReactionAdded",
    eventId: "evt-2",
    actorUserId: "u-bob",
    recipientUserId: "u-alice",
    postId: "fp-1",
    reactionType: "like",
    occurredAt: "2026-05-30T11:00:00Z",
    correlationId: null,
    ...overrides,
  };
}

function commentReactionEvent(overrides: Partial<FriendFeedCommentReactionAddedEvent> = {}): FriendFeedCommentReactionAddedEvent {
  return {
    type: "FriendFeedCommentReactionAdded",
    eventId: "evt-3",
    actorUserId: "u-bob",
    recipientUserId: "u-alice",
    postId: "fp-1",
    commentId: "fpc-1",
    reactionType: "like",
    occurredAt: "2026-05-30T11:00:00Z",
    correlationId: null,
    ...overrides,
  };
}

describe("application-v2 notification orchestrator — friend feed events", () => {
  it("FriendFeedCommentCreated → creates a notification for the recipient", async () => {
    const { svc, orch } = makeStack();
    const res = await orch.handleFriendFeedCommentCreated(commentEvent());
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.created).toBe(true);
    const page = await svc.listForViewer({ viewerUserId: "u-alice" });
    expect(page.ok && page.value.items).toHaveLength(1);
    if (page.ok) {
      expect(page.value.items[0].type).toBe("friend_post_comment");
      expect(page.value.items[0].source.routeTarget).toContain("/friends-feed?postId=fp-1");
    }
  });

  it("FriendFeedReactionAdded → creates a notification", async () => {
    const { svc, orch } = makeStack();
    const res = await orch.handleFriendFeedReactionAdded(reactionEvent());
    expect(res.ok && res.value.created).toBe(true);
    const page = await svc.listForViewer({ viewerUserId: "u-alice" });
    expect(page.ok && page.value.items).toHaveLength(1);
    if (page.ok) {
      expect(page.value.items[0].type).toBe("friend_post_reaction");
    }
  });

  it("FriendFeedCommentReactionAdded → creates a notification", async () => {
    const { svc, orch } = makeStack();
    const res = await orch.handleFriendFeedCommentReactionAdded(commentReactionEvent());
    expect(res.ok && res.value.created).toBe(true);
    const page = await svc.listForViewer({ viewerUserId: "u-alice" });
    if (page.ok) {
      expect(page.value.items[0].type).toBe("friend_post_comment_reaction");
    }
  });

  it("actor === recipient is skipped (no notification created)", async () => {
    const { svc, orch } = makeStack();
    const res = await orch.handleFriendFeedCommentCreated(
      commentEvent({ actorUserId: "u-alice", recipientUserId: "u-alice" }),
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.created).toBe(false);
    if (res.value.created) return;
    expect(res.value.reason).toBe("actor_is_recipient");
    const page = await svc.listForViewer({ viewerUserId: "u-alice" });
    expect(page.ok && page.value.items).toHaveLength(0);
  });

  it("duplicate event id does not duplicate the notification", async () => {
    const { svc, orch } = makeStack();
    await orch.handleFriendFeedCommentCreated(commentEvent());
    const second = await orch.handleFriendFeedCommentCreated(commentEvent());
    expect(second.ok).toBe(true);
    if (second.ok && !second.value.created) {
      expect(second.value.reason).toBe("duplicate");
    }
    const page = await svc.listForViewer({ viewerUserId: "u-alice" });
    expect(page.ok && page.value.items).toHaveLength(1);
  });

  it("disabled category short-circuits the handler", async () => {
    const { svc, orch } = makeStack();
    await svc.updateSettings({ viewerUserId: "u-alice", category: "friend_feed", inAppEnabled: false });
    const res = await orch.handleFriendFeedReactionAdded(reactionEvent());
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.created).toBe(false);
    if (res.value.created) return;
    expect(res.value.reason).toBe("category_disabled");
  });

  it("created notification carries no PII (only ids + short generic copy)", async () => {
    const { svc, orch } = makeStack();
    await orch.handleFriendFeedCommentCreated(commentEvent());
    const page = await svc.listForViewer({ viewerUserId: "u-alice" });
    if (!page.ok) throw new Error("setup");
    const dto = page.value.items[0];
    expect(dto.title).not.toMatch(/@/);
    expect(dto.bodyPreview).not.toMatch(/@/);
    expect(dto.title.length).toBeLessThan(140);
    expect(dto.bodyPreview.length).toBeLessThan(240);
  });
});
