import { describe, expect, it } from "vitest";
import {
  findRegistryIntegrityViolations,
  isNotificationCategory,
  NOTIFICATION_EVENT_REGISTRY,
} from "../public-api";

describe("notifications-v2 event registry", () => {
  it("has at least one entry per top-level source domain", () => {
    const domains = new Set(NOTIFICATION_EVENT_REGISTRY.map((e) => e.sourceDomain.split("/")[0].split(" ")[0]));
    expect(domains.has("content-v2")).toBe(true);
    expect(domains.has("communities-v2")).toBe(true);
    expect(domains.has("channels")).toBe(true);
    expect(domains.has("events-v2")).toBe(true);
    expect(domains.has("newsletter-chat-v2")).toBe(true);
  });

  it("every entry has the required decision fields filled", () => {
    const violations = findRegistryIntegrityViolations();
    expect(violations).toHaveLength(0);
  });

  it("every entry that creates a notification has a valid category", () => {
    for (const entry of NOTIFICATION_EVENT_REGISTRY) {
      if (!entry.createsNotification) continue;
      expect(entry.category).not.toBeNull();
      if (entry.category) {
        expect(isNotificationCategory(entry.category)).toBe(true);
      }
    }
  });

  it("uses only the allowed handlerStatus values", () => {
    const allowed = new Set([
      "implemented",
      "planned",
      "no_notification_needed",
      "blocked_by_missing_source_event",
    ]);
    for (const entry of NOTIFICATION_EVENT_REGISTRY) {
      expect(allowed.has(entry.handlerStatus)).toBe(true);
    }
  });

  it("entries marked no_notification_needed do NOT promise a notification", () => {
    for (const entry of NOTIFICATION_EVENT_REGISTRY) {
      if (entry.handlerStatus === "no_notification_needed") {
        expect(entry.createsNotification).toBe(false);
      }
    }
  });
});
