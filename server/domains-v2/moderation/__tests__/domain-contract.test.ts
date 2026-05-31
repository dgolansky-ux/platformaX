import { describe, it, expect } from "vitest";

describe("moderation domain contract (Slice 20 BACKEND_PARTIAL)", () => {
  it("public-api exposes the runtime surface", async () => {
    const mod = await import("../public-api");
    expect(typeof mod.createModerationService).toBe("function");
    expect(typeof mod.createInMemoryModerationRepository).toBe("function");
    expect(typeof mod.createNoopModerationEventPublisher).toBe("function");
    expect(typeof mod.canCreateReport).toBe("function");
    expect(typeof mod.canReviewReports).toBe("function");
    expect(typeof mod.canTakeAction).toBe("function");
  });

  it("exposes the target + reason registries", async () => {
    const mod = await import("../public-api");
    expect(Array.isArray(mod.MODERATION_TARGET_TYPES)).toBe(true);
    expect(mod.MODERATION_TARGET_TYPES.length).toBeGreaterThan(0);
    expect(Array.isArray(mod.MODERATION_REPORT_REASONS)).toBe(true);
    expect(mod.MODERATION_REPORT_REASONS.length).toBeGreaterThan(0);
    expect(Array.isArray(mod.MODERATION_TARGET_DEFINITIONS)).toBe(true);
    expect(Array.isArray(mod.MODERATION_REPORT_REASON_DEFINITIONS)).toBe(true);
  });

  it("reason definitions cover every reason key", async () => {
    const mod = await import("../public-api");
    const defKeys = mod.MODERATION_REPORT_REASON_DEFINITIONS.map((d) => d.key).sort();
    expect(defKeys).toEqual([...mod.MODERATION_REPORT_REASONS].sort());
  });

  it("target definitions cover every target type", async () => {
    const mod = await import("../public-api");
    const defKeys = mod.MODERATION_TARGET_DEFINITIONS.map((d) => d.targetType).sort();
    expect(defKeys).toEqual([...mod.MODERATION_TARGET_TYPES].sort());
  });
});
