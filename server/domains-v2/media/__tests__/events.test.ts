import { describe, it, expect } from "vitest";
import {
  mediaUploadIntentCreatedEvent,
  mediaUploadConfirmedEvent,
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

// UUID-shaped fixtures aligned with media_assets.id uuid, outbox.event_id uuid.
const USER_A = "00000000-0000-4000-8000-000000000001";
const USER_B = "00000000-0000-4000-8000-000000000002";
const USER_C = "00000000-0000-4000-8000-000000000003";
const ASSET_A = "00000000-0000-4000-8000-0000000000a1";
const ASSET_B = "00000000-0000-4000-8000-0000000000a2";
const ASSET_C = "00000000-0000-4000-8000-0000000000a3";
const EVENT_A = "00000000-0000-4000-8000-00000000000a";
const EVENT_B = "00000000-0000-4000-8000-00000000000b";

describe("media events — EventEnvelope shape", () => {
  it("upload.intent_created carries the full envelope shape", () => {
    const event = mediaUploadIntentCreatedEvent({
      assetId: ASSET_A,
      ownerId: USER_A,
      purpose: "avatar",
      occurredAt: "2026-05-27T00:00:00.000Z",
      generateId: () => EVENT_A,
    });
    for (const field of ENVELOPE_FIELDS) {
      expect(field in event, `missing ${field}`).toBe(true);
    }
    expect(event.id).toBe(EVENT_A);
    expect(event.type).toBe("media.upload.intent_created");
    expect(event.actorId).toBe(USER_A);
    expect(event.payload).toEqual({
      assetId: ASSET_A,
      ownerId: USER_A,
      purpose: "avatar",
    });
  });

  it("upload.confirmed carries the full envelope shape", () => {
    const event = mediaUploadConfirmedEvent({
      assetId: ASSET_B,
      ownerId: USER_B,
      purpose: "banner",
      generateId: () => EVENT_B,
    });
    expect(event.type).toBe("media.upload.confirmed");
    expect(event.payload.purpose).toBe("banner");
    expect(typeof event.occurredAt).toBe("string");
  });

  it("idempotencyKey is always present, even when null", () => {
    const event = mediaUploadConfirmedEvent({
      assetId: ASSET_C,
      ownerId: USER_C,
      purpose: "statusPhoto",
    });
    expect("idempotencyKey" in event).toBe(true);
    expect(event.idempotencyKey).toBeNull();
  });

  it("default generated event id is UUID-compatible", () => {
    const event = mediaUploadIntentCreatedEvent({
      assetId: ASSET_A,
      ownerId: USER_A,
      purpose: "avatar",
    });
    expect(isUuid(event.id)).toBe(true);
  });

  it("payload exposes only asset/owner/purpose — no storage internals or PII", () => {
    const event = mediaUploadIntentCreatedEvent({
      assetId: ASSET_C,
      ownerId: USER_C,
      purpose: "avatar",
    });
    expect(Object.keys(event.payload).sort()).toEqual(["assetId", "ownerId", "purpose"]);
    const json = JSON.stringify(event);
    for (const leak of ["storageKey", "publicUrl", "provider", "sizeBytes", "mimeType"]) {
      expect(json).not.toContain(leak);
    }
  });
});
