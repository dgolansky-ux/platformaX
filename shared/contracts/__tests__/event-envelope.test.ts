import { describe, it, expect } from "vitest";
import { createEventEnvelope } from "@shared/contracts/event-envelope";
import { asUserId } from "@shared/contracts/ids";
import { isUuid } from "@shared/contracts/uuid";

// UUID-shaped fixtures aligned with outbox_messages.event_id uuid /
// outbox_messages.actor_id uuid in supabase/migrations.
const USER_A = "00000000-0000-4000-8000-000000000001";
const EVENT_A = "00000000-0000-4000-8000-00000000000a";
const EVENT_B = "00000000-0000-4000-8000-00000000000b";

describe("createEventEnvelope", () => {
  it("produces all required envelope fields", () => {
    const env = createEventEnvelope(
      {
        type: "test.thing.happened",
        actorId: asUserId(USER_A),
        payload: { userId: asUserId(USER_A) },
      },
      { generateId: () => EVENT_A, now: () => new Date("2026-05-27T00:00:00.000Z") },
    );

    expect(env.id).toBe(EVENT_A);
    expect(env.type).toBe("test.thing.happened");
    expect(env.version).toBe(1);
    expect(env.occurredAt).toBe("2026-05-27T00:00:00.000Z");
    expect(env.actorId).toBe(USER_A);
    expect(env.payload).toEqual({ userId: USER_A });
    expect(env.idempotencyKey).toBeNull();
  });

  it("idempotencyKey is always present even when null", () => {
    const env = createEventEnvelope(
      { type: "t.a.b", actorId: null, payload: {} },
      { generateId: () => EVENT_B, now: () => new Date(0) },
    );
    expect("idempotencyKey" in env).toBe(true);
    expect(env.idempotencyKey).toBeNull();
  });

  it("honors explicit version, occurredAt and idempotencyKey", () => {
    const env = createEventEnvelope({
      type: "t.a.b",
      version: 3,
      actorId: null,
      payload: { a: 1 },
      occurredAt: "2026-01-01T00:00:00.000Z",
      idempotencyKey: "idem-1",
      id: EVENT_A,
    });
    expect(env.version).toBe(3);
    expect(env.occurredAt).toBe("2026-01-01T00:00:00.000Z");
    expect(env.idempotencyKey).toBe("idem-1");
    expect(env.id).toBe(EVENT_A);
  });

  it("falls back to a UUID-compatible id when none is injected", () => {
    const env = createEventEnvelope({ type: "t.a.b", actorId: null, payload: {} });
    expect(typeof env.id).toBe("string");
    // Default generator must align with outbox_messages.event_id uuid.
    expect(isUuid(env.id)).toBe(true);
    expect(typeof env.occurredAt).toBe("string");
  });
});
