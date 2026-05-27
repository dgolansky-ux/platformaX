import { describe, it, expect } from "vitest";
import { createEventEnvelope } from "@shared/contracts/event-envelope";
import { asUserId } from "@shared/contracts/ids";

describe("createEventEnvelope", () => {
  it("produces all required envelope fields", () => {
    const env = createEventEnvelope(
      {
        type: "test.thing.happened",
        actorId: asUserId("u_1"),
        payload: { userId: asUserId("u_1") },
      },
      { generateId: () => "fixed-id", now: () => new Date("2026-05-27T00:00:00.000Z") },
    );

    expect(env.id).toBe("fixed-id");
    expect(env.type).toBe("test.thing.happened");
    expect(env.version).toBe(1);
    expect(env.occurredAt).toBe("2026-05-27T00:00:00.000Z");
    expect(env.actorId).toBe("u_1");
    expect(env.payload).toEqual({ userId: "u_1" });
    expect(env.idempotencyKey).toBeNull();
  });

  it("idempotencyKey is always present even when null", () => {
    const env = createEventEnvelope(
      { type: "t", actorId: null, payload: {} },
      { generateId: () => "x", now: () => new Date(0) },
    );
    expect("idempotencyKey" in env).toBe(true);
    expect(env.idempotencyKey).toBeNull();
  });

  it("honors explicit version, occurredAt and idempotencyKey", () => {
    const env = createEventEnvelope({
      type: "t",
      version: 3,
      actorId: null,
      payload: { a: 1 },
      occurredAt: "2026-01-01T00:00:00.000Z",
      idempotencyKey: "idem-1",
      id: "id-1",
    });
    expect(env.version).toBe(3);
    expect(env.occurredAt).toBe("2026-01-01T00:00:00.000Z");
    expect(env.idempotencyKey).toBe("idem-1");
    expect(env.id).toBe("id-1");
  });

  it("falls back to a generated id when none injected", () => {
    const env = createEventEnvelope({ type: "t", actorId: null, payload: {} });
    expect(typeof env.id).toBe("string");
    expect(env.id.length).toBeGreaterThan(0);
    expect(typeof env.occurredAt).toBe("string");
  });
});
