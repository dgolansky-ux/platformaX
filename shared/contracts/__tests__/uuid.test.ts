import { describe, it, expect } from "vitest";
import { createUuid, isUuid } from "../uuid";

describe("uuid helper", () => {
  it("createUuid returns a UUID-formatted string", () => {
    const id = createUuid();
    expect(isUuid(id)).toBe(true);
  });

  it("createUuid produces distinct values across calls", () => {
    const a = createUuid();
    const b = createUuid();
    expect(a).not.toBe(b);
  });

  it("isUuid accepts canonical v4 fixtures used by tests/migrations", () => {
    expect(isUuid("00000000-0000-4000-8000-000000000001")).toBe(true);
    expect(isUuid("00000000-0000-4000-8000-000000000002")).toBe(true);
    expect(isUuid("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
  });

  it("isUuid rejects legacy prefixed ids", () => {
    expect(isUuid("evt_abc")).toBe(false);
    expect(isUuid("obx_1")).toBe(false);
    expect(isUuid("media_xyz")).toBe(false);
    expect(isUuid("")).toBe(false);
    expect(isUuid(undefined as unknown as string)).toBe(false);
  });
});
