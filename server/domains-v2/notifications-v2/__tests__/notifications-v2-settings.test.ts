import { describe, expect, it } from "vitest";
import {
  createInMemoryNotificationRepository,
  createInMemoryNotificationSettingsRepository,
  createNotificationsService,
  NOTIFICATION_CATEGORIES,
  type NotificationsService,
} from "../public-api";

function makeService(): NotificationsService {
  let seq = 0;
  return createNotificationsService({
    notifications: createInMemoryNotificationRepository(),
    settings: createInMemoryNotificationSettingsRepository(),
    clock: { now: () => new Date(`2026-05-30T09:${String(seq % 60).padStart(2, "0")}:00Z`) },
    ids: { next: () => `notif-${++seq}` },
  });
}

describe("notifications-v2 settings", () => {
  it("returns default settings (all in-app enabled) for an unknown user", async () => {
    const svc = makeService();
    const res = await svc.getSettings("u-alice");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.userId).toBe("u-alice");
    expect(res.value.categories.length).toBe(NOTIFICATION_CATEGORIES.length);
    for (const c of res.value.categories) {
      expect(c.inAppEnabled).toBe(true);
    }
  });

  it("user can disable a category", async () => {
    const svc = makeService();
    const updated = await svc.updateSettings({
      viewerUserId: "u-alice",
      category: "channels",
      inAppEnabled: false,
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    const channels = updated.value.categories.find((c) => c.category === "channels");
    expect(channels?.inAppEnabled).toBe(false);
    const friendFeed = updated.value.categories.find((c) => c.category === "friend_feed");
    expect(friendFeed?.inAppEnabled).toBe(true);
  });

  it("cannot update settings for another user (viewerUserId is the only writable subject)", async () => {
    const svc = makeService();
    await svc.updateSettings({ viewerUserId: "u-alice", category: "channels", inAppEnabled: false });
    // Reading another user's settings is allowed (defaults) but returns default state
    // because updates for u-alice never leak into u-bob.
    const bob = await svc.getSettings("u-bob");
    if (!bob.ok) throw new Error("setup");
    const bobChannels = bob.value.categories.find((c) => c.category === "channels");
    expect(bobChannels?.inAppEnabled).toBe(true);
  });

  it("invalid category is rejected", async () => {
    const svc = makeService();
    // Cast through unknown to avoid `as any`; this exercises runtime validation.
    const res = await svc.updateSettings({
      viewerUserId: "u-alice",
      category: "bogus" as unknown as "channels",
      inAppEnabled: false,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("VALIDATION_FAILED");
  });
});
