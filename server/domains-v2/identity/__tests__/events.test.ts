import { describe, it, expect } from "vitest";
import {
  identityOnboardingCompletedEvent,
  identityProfilePublicSummaryChangedEvent,
} from "../events";

const ENVELOPE_FIELDS = [
  "id",
  "type",
  "version",
  "occurredAt",
  "actorId",
  "payload",
  "idempotencyKey",
];

describe("identity events — EventEnvelope shape", () => {
  it("onboarding.completed carries the full envelope shape", () => {
    const event = identityOnboardingCompletedEvent("user-1", {
      occurredAt: "2026-05-27T00:00:00.000Z",
      generateId: () => "ev-1",
    });
    for (const field of ENVELOPE_FIELDS) {
      expect(field in event, `missing ${field}`).toBe(true);
    }
    expect(event.type).toBe("identity.onboarding.completed");
    expect(event.version).toBe(1);
    expect(event.occurredAt).toBe("2026-05-27T00:00:00.000Z");
    expect(event.actorId).toBe("user-1");
    expect(event.payload).toEqual({ userId: "user-1" });
  });

  it("public_summary_changed carries the full envelope shape", () => {
    const event = identityProfilePublicSummaryChangedEvent("user-2", {
      generateId: () => "ev-2",
    });
    expect(event.type).toBe("identity.profile.public_summary_changed");
    expect(event.payload).toEqual({ userId: "user-2" });
    expect(typeof event.occurredAt).toBe("string");
  });

  it("idempotencyKey is always present, even when null", () => {
    const event = identityOnboardingCompletedEvent("user-1");
    expect("idempotencyKey" in event).toBe(true);
    expect(event.idempotencyKey).toBeNull();
  });

  it("payload contains no PII (only branded user id)", () => {
    const event = identityOnboardingCompletedEvent("user-1");
    const keys = Object.keys(event.payload);
    expect(keys).toEqual(["userId"]);
    const json = JSON.stringify(event);
    for (const pii of ["email", "phone", "dateOfBirth", "firstName", "lastName"]) {
      expect(json).not.toContain(pii);
    }
  });
});
