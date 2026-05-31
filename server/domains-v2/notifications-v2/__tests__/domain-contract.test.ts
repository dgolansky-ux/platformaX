import { describe, expect, it } from "vitest";
import * as publicApi from "../public-api";

describe("notifications-v2 domain contract", () => {
  it("exposes the service factory and in-memory adapters", () => {
    expect(typeof publicApi.createNotificationsService).toBe("function");
    expect(typeof publicApi.createInMemoryNotificationRepository).toBe("function");
    expect(typeof publicApi.createInMemoryNotificationSettingsRepository).toBe("function");
  });

  it("exposes typed category guards", () => {
    expect(publicApi.isNotificationCategory("friend_feed")).toBe(true);
    expect(publicApi.isNotificationCategory("unknown_category")).toBe(false);
  });

  it("exports the event registry and integrity check", () => {
    expect(Array.isArray(publicApi.NOTIFICATION_EVENT_REGISTRY)).toBe(true);
    expect(publicApi.NOTIFICATION_EVENT_REGISTRY.length).toBeGreaterThan(0);
    expect(typeof publicApi.findRegistryIntegrityViolations).toBe("function");
  });

  it("exports the public category list (no PII / contact fields)", () => {
    for (const category of publicApi.NOTIFICATION_CATEGORIES) {
      expect(typeof category).toBe("string");
    }
  });
});
