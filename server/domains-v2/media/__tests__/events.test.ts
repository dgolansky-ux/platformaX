import { describe, it, expect } from "vitest";
import {
  mediaUploadIntentCreatedEvent,
  mediaUploadConfirmedEvent,
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

describe("media events — EventEnvelope shape", () => {
  it("upload.intent_created carries the full envelope shape", () => {
    const event = mediaUploadIntentCreatedEvent({
      assetId: "asset-1",
      ownerId: "user-1",
      purpose: "avatar",
      occurredAt: "2026-05-27T00:00:00.000Z",
      generateId: () => "ev-1",
    });
    for (const field of ENVELOPE_FIELDS) {
      expect(field in event, `missing ${field}`).toBe(true);
    }
    expect(event.type).toBe("media.upload.intent_created");
    expect(event.actorId).toBe("user-1");
    expect(event.payload).toEqual({
      assetId: "asset-1",
      ownerId: "user-1",
      purpose: "avatar",
    });
  });

  it("upload.confirmed carries the full envelope shape", () => {
    const event = mediaUploadConfirmedEvent({
      assetId: "asset-2",
      ownerId: "user-2",
      purpose: "banner",
      generateId: () => "ev-2",
    });
    expect(event.type).toBe("media.upload.confirmed");
    expect(event.payload.purpose).toBe("banner");
    expect(typeof event.occurredAt).toBe("string");
  });

  it("idempotencyKey is always present, even when null", () => {
    const event = mediaUploadConfirmedEvent({
      assetId: "a",
      ownerId: "u",
      purpose: "statusPhoto",
    });
    expect("idempotencyKey" in event).toBe(true);
    expect(event.idempotencyKey).toBeNull();
  });

  it("payload exposes only asset/owner/purpose — no storage internals or PII", () => {
    const event = mediaUploadIntentCreatedEvent({
      assetId: "asset-3",
      ownerId: "user-3",
      purpose: "avatar",
    });
    expect(Object.keys(event.payload).sort()).toEqual(["assetId", "ownerId", "purpose"]);
    const json = JSON.stringify(event);
    for (const leak of ["storageKey", "publicUrl", "provider", "sizeBytes", "mimeType"]) {
      expect(json).not.toContain(leak);
    }
  });
});
