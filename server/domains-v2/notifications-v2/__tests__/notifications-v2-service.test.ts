import { describe, expect, it } from "vitest";
import {
  createInMemoryNotificationRepository,
  createInMemoryNotificationSettingsRepository,
  createNotificationsService,
  type CreateNotificationInput,
  type NotificationsService,
} from "../public-api";

function buildSource(): CreateNotificationInput["source"] {
  return {
    sourceDomain: "content-v2/friend-posts",
    sourceType: "FriendFeedComment",
    sourceId: "fpc-1",
    routeTarget: "/friends-feed?postId=fp-1#comment-fpc-1",
  };
}

function makeService(): NotificationsService {
  let seq = 0;
  return createNotificationsService({
    notifications: createInMemoryNotificationRepository(),
    settings: createInMemoryNotificationSettingsRepository(),
    clock: { now: () => new Date(`2026-05-30T10:${String(seq % 60).padStart(2, "0")}:00Z`) },
    ids: { next: () => `notif-${++seq}` },
  });
}

function baseInput(overrides: Partial<CreateNotificationInput> = {}): CreateNotificationInput {
  return {
    recipientUserId: "u-alice",
    actorUserId: "u-bob",
    type: "friend_post_comment",
    category: "friend_feed",
    title: "Bob skomentował Twój wpis",
    bodyPreview: "Nowy komentarz pod Twoim wpisem.",
    source: buildSource(),
    dedupeKey: null,
    correlationId: null,
    ...overrides,
  };
}

describe("notifications-v2 service", () => {
  it("creates a notification for the recipient", async () => {
    const svc = makeService();
    const res = await svc.createNotification(baseInput());
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.created).toBe(true);
    if (!res.value.created) return;
    expect(res.value.notification.status).toBe("unread");
    expect(res.value.notification.deliveryChannel).toBe("in_app");
    expect(res.value.notification.recipientUserId).toBe("u-alice");
    expect(res.value.notification.actorUserId).toBe("u-bob");
  });

  it("skips creation when actor equals recipient", async () => {
    const svc = makeService();
    const res = await svc.createNotification(baseInput({ actorUserId: "u-alice" }));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.created).toBe(false);
    if (res.value.created) return;
    expect(res.value.reason).toBe("actor_is_recipient");
  });

  it("dedupeKey prevents duplicate notifications", async () => {
    const svc = makeService();
    const first = await svc.createNotification(baseInput({ dedupeKey: "comment:fpc-1" }));
    const dup = await svc.createNotification(baseInput({ dedupeKey: "comment:fpc-1" }));
    expect(first.ok && first.value.created).toBe(true);
    expect(dup.ok).toBe(true);
    if (!dup.ok) return;
    expect(dup.value.created).toBe(false);
    if (dup.value.created) return;
    expect(dup.value.reason).toBe("duplicate");
  });

  it("disabled category prevents creation", async () => {
    const svc = makeService();
    await svc.updateSettings({ viewerUserId: "u-alice", category: "friend_feed", inAppEnabled: false });
    const res = await svc.createNotification(baseInput());
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.created).toBe(false);
    if (res.value.created) return;
    expect(res.value.reason).toBe("category_disabled");
  });

  it("rejects empty title / body / invalid route", async () => {
    const svc = makeService();
    const noTitle = await svc.createNotification(baseInput({ title: "   " }));
    expect(noTitle.ok).toBe(false);
    const noBody = await svc.createNotification(baseInput({ bodyPreview: "" }));
    expect(noBody.ok).toBe(false);
    const badRoute = await svc.createNotification(
      baseInput({ source: { ...buildSource(), routeTarget: "javascript:alert(1)" } }),
    );
    expect(badRoute.ok).toBe(false);
  });

  it("lists only own notifications, newest first", async () => {
    const svc = makeService();
    await svc.createNotification(baseInput());
    await svc.createNotification(baseInput({ recipientUserId: "u-charlie" }));
    await svc.createNotification(baseInput({ dedupeKey: "comment:fpc-2", source: { ...buildSource(), sourceId: "fpc-2" } }));
    const page = await svc.listForViewer({ viewerUserId: "u-alice" });
    expect(page.ok).toBe(true);
    if (!page.ok) return;
    expect(page.value.items).toHaveLength(2);
    expect(page.value.items.every((n) => n.recipientUserId === "u-alice")).toBe(true);
    expect(page.value.items[0].createdAt >= page.value.items[1].createdAt).toBe(true);
  });

  it("filters by unread + category", async () => {
    const svc = makeService();
    await svc.createNotification(baseInput()); // friend_feed
    await svc.createNotification(
      baseInput({
        category: "communities",
        type: "community_invite",
        title: "Zaproszenie do społeczności",
        bodyPreview: "Otrzymałeś zaproszenie",
        source: { ...buildSource(), sourceDomain: "communities-v2", sourceType: "CommunityInvite", sourceId: "ci-1" },
      }),
    );
    const unread = await svc.listForViewer({ viewerUserId: "u-alice", filter: { kind: "unread" } });
    expect(unread.ok && unread.value.items).toHaveLength(2);
    const onlyCommunities = await svc.listForViewer({
      viewerUserId: "u-alice",
      filter: { kind: "category", category: "communities" },
    });
    expect(onlyCommunities.ok && onlyCommunities.value.items).toHaveLength(1);
    if (onlyCommunities.ok) {
      expect(onlyCommunities.value.items[0].category).toBe("communities");
    }
  });

  it("mark read updates status and removes from unread filter", async () => {
    const svc = makeService();
    const created = await svc.createNotification(baseInput());
    if (!created.ok || !created.value.created) throw new Error("setup");
    const notif = created.value.notification;
    const marked = await svc.markRead({ viewerUserId: "u-alice", notificationId: notif.id });
    expect(marked.ok).toBe(true);
    if (!marked.ok) return;
    expect(marked.value.status).toBe("read");
    const unread = await svc.listForViewer({ viewerUserId: "u-alice", filter: { kind: "unread" } });
    expect(unread.ok && unread.value.items).toHaveLength(0);
  });

  it("cannot mark another user's notification", async () => {
    const svc = makeService();
    const created = await svc.createNotification(baseInput({ recipientUserId: "u-charlie" }));
    if (!created.ok || !created.value.created) throw new Error("setup");
    const notif = created.value.notification;
    const res = await svc.markRead({ viewerUserId: "u-mallory", notificationId: notif.id });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("markAllRead returns affected count and clears unread", async () => {
    const svc = makeService();
    await svc.createNotification(baseInput({ dedupeKey: "a" }));
    await svc.createNotification(baseInput({ dedupeKey: "b", source: { ...buildSource(), sourceId: "x" } }));
    const res = await svc.markAllRead({ viewerUserId: "u-alice" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.affected).toBe(2);
    const unread = await svc.listForViewer({ viewerUserId: "u-alice", filter: { kind: "unread" } });
    expect(unread.ok && unread.value.items).toHaveLength(0);
  });

  it("archive hides notification from listings and unread count", async () => {
    const svc = makeService();
    const created = await svc.createNotification(baseInput());
    if (!created.ok || !created.value.created) throw new Error("setup");
    const archived = await svc.archive({ viewerUserId: "u-alice", notificationId: created.value.notification.id });
    expect(archived.ok && archived.value.status).toBe("archived");
    const page = await svc.listForViewer({ viewerUserId: "u-alice" });
    expect(page.ok && page.value.items).toHaveLength(0);
  });

  it("getUnreadCount is real (per-category sum)", async () => {
    const svc = makeService();
    await svc.createNotification(baseInput()); // friend_feed
    await svc.createNotification(
      baseInput({
        category: "communities",
        type: "community_invite",
        title: "Zaproszenie",
        bodyPreview: "preview",
        source: { ...buildSource(), sourceDomain: "communities-v2", sourceId: "ci-1" },
      }),
    );
    const counts = await svc.getUnreadCount("u-alice");
    expect(counts.ok).toBe(true);
    if (!counts.ok) return;
    expect(counts.value.total).toBe(2);
    expect(counts.value.byCategory.friend_feed).toBe(1);
    expect(counts.value.byCategory.communities).toBe(1);
    expect(counts.value.byCategory.system).toBe(0);
  });

  it("respects list pagination cursor and bounded limit", async () => {
    const svc = makeService();
    for (let i = 0; i < 7; i += 1) {
      await svc.createNotification(
        baseInput({
          dedupeKey: `k-${i}`,
          source: { ...buildSource(), sourceId: `fpc-${i}` },
        }),
      );
    }
    const first = await svc.listForViewer({ viewerUserId: "u-alice", limit: 3 });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.items).toHaveLength(3);
    expect(first.value.nextCursor).not.toBeNull();
    const next = await svc.listForViewer({
      viewerUserId: "u-alice",
      limit: 3,
      cursor: first.value.nextCursor,
    });
    expect(next.ok && next.value.items).toHaveLength(3);
  });

  it("public DTO carries no PII fields (no email/phone, no raw source body)", async () => {
    const svc = makeService();
    const created = await svc.createNotification(baseInput());
    if (!created.ok || !created.value.created) throw new Error("setup");
    const dto = created.value.notification;
    expect(dto).not.toHaveProperty("recipientEmail");
    expect(dto).not.toHaveProperty("recipientPhone");
    expect(dto).not.toHaveProperty("rawSourcePayload");
    expect(dto).not.toHaveProperty("dedupeKey");
    expect(dto).not.toHaveProperty("correlationId");
  });
});
