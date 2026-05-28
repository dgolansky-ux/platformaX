import { describe, it, expect } from "vitest";
import {
  identityOnboardingCompletedEvent,
  identityProfilePublicSummaryChangedEvent,
} from "../events";
import { isUuid } from "@shared/contracts/uuid";

const ENVELOPE_FIELDS = [
  "id",
  "type",
  "version",
  "occurredAt",
  "actorId",
  "payload",
  "idempotencyKey",
];

// UUID-shaped fixtures aligned with outbox_messages.event_id uuid /
// outbox_messages.actor_id uuid in supabase/migrations.
const USER_A = "00000000-0000-4000-8000-000000000001";
const USER_B = "00000000-0000-4000-8000-000000000002";
const EVENT_A = "00000000-0000-4000-8000-00000000000a";
const EVENT_B = "00000000-0000-4000-8000-00000000000b";

describe("identity events — EventEnvelope shape", () => {
  it("onboarding.completed carries the full envelope shape", () => {
    const event = identityOnboardingCompletedEvent(USER_A, {
      occurredAt: "2026-05-27T00:00:00.000Z",
      generateId: () => EVENT_A,
    });
    for (const field of ENVELOPE_FIELDS) {
      expect(field in event, `missing ${field}`).toBe(true);
    }
    expect(event.id).toBe(EVENT_A);
    expect(event.type).toBe("identity.onboarding.completed");
    expect(event.version).toBe(1);
    expect(event.occurredAt).toBe("2026-05-27T00:00:00.000Z");
    expect(event.actorId).toBe(USER_A);
    expect(event.payload).toEqual({ userId: USER_A });
  });

  it("public_summary_changed carries the full envelope shape", () => {
    const event = identityProfilePublicSummaryChangedEvent(USER_B, {
      generateId: () => EVENT_B,
    });
    expect(event.type).toBe("identity.profile.public_summary_changed");
    expect(event.payload).toEqual({ userId: USER_B });
    expect(typeof event.occurredAt).toBe("string");
  });

  it("idempotencyKey is always present, even when null", () => {
    const event = identityOnboardingCompletedEvent(USER_A);
    expect("idempotencyKey" in event).toBe(true);
    expect(event.idempotencyKey).toBeNull();
  });

  it("default generated event id is UUID-compatible", () => {
    const event = identityOnboardingCompletedEvent(USER_A);
    // Default generator must align with outbox_messages.event_id uuid.
    expect(isUuid(event.id)).toBe(true);
  });

  it("payload contains no PII (only branded user id)", () => {
    const event = identityOnboardingCompletedEvent(USER_A);
    const keys = Object.keys(event.payload);
    expect(keys).toEqual(["userId"]);
    const json = JSON.stringify(event);
    for (const pii of ["email", "phone", "dateOfBirth", "firstName", "lastName"]) {
      expect(json).not.toContain(pii);
    }
  });
});
