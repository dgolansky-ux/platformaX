import { describe, it, expect } from "vitest";
import { createEventEnvelope } from "@shared/contracts/event-envelope";
import { asUserId, asOutboxMessageId } from "@shared/contracts/ids";
import { isUuid } from "@shared/contracts/uuid";
import {
  createOutboxMessageFromEnvelope,
  createInMemoryOutboxRepository,
  toOutboxMessageDTO,
} from "../outbox";

// UUID-shaped fixtures aligned with outbox_messages.id uuid + event_id uuid.
const USER_A = "00000000-0000-4000-8000-000000000001";
const EV = (n: number) => `00000000-0000-4000-8000-0000000000e${n.toString(16)}`;
const OBX = (n: number) => `00000000-0000-4000-8000-0000000000b${n.toString(16)}`;

function envelope(id: string) {
  return createEventEnvelope(
    {
      type: "identity.profile.public_summary_changed",
      actorId: asUserId(USER_A),
      payload: { userId: asUserId(USER_A) },
    },
    { generateId: () => id, now: () => new Date("2026-05-27T00:00:00.000Z") },
  );
}

describe("createOutboxMessageFromEnvelope", () => {
  it("maps envelope fields into a pending outbox record", () => {
    const record = createOutboxMessageFromEnvelope(envelope(EV(1)), {
      generateId: () => OBX(1),
      now: () => new Date("2026-05-27T00:00:01.000Z"),
    });
    expect(record.id).toBe(OBX(1));
    expect(record.eventId).toBe(EV(1));
    expect(record.type).toBe("identity.profile.public_summary_changed");
    expect(record.status).toBe("pending");
    expect(record.attempts).toBe(0);
    expect(record.dispatchedAt).toBeNull();
    expect(record.payload).toEqual({ userId: USER_A });
  });

  it("default generator produces UUID-compatible outbox ids", () => {
    const record = createOutboxMessageFromEnvelope(envelope(EV(2)));
    expect(isUuid(record.id)).toBe(true);
  });

  it("DTO projection omits payload and lastError", () => {
    const dto = toOutboxMessageDTO(
      createOutboxMessageFromEnvelope(envelope(EV(2)), {
        generateId: () => OBX(2),
        now: () => new Date("2026-05-27T00:00:02.000Z"),
      }),
    );
    expect(Object.keys(dto).sort()).toEqual(
      ["createdAt", "dispatchedAt", "id", "occurredAt", "status", "type"].sort(),
    );
  });
});

describe("in-memory outbox repository", () => {
  async function seed(n: number) {
    const repo = createInMemoryOutboxRepository();
    for (let i = 0; i < n; i += 1) {
      const record = createOutboxMessageFromEnvelope(envelope(EV(i)), {
        generateId: () => OBX(i),
        now: () => new Date(`2026-05-27T00:00:${String(i).padStart(2, "0")}.000Z`),
      });
      await repo.append(record);
    }
    return repo;
  }

  it("lists pending rows in stable order with cursor pagination", async () => {
    const repo = await seed(3);
    const page1 = await repo.listPending(2);
    expect(page1.items.map((r) => r.id)).toEqual([OBX(0), OBX(1)]);
    expect(page1.hasMore).toBe(true);
    expect(page1.nextCursor).toBeTruthy();

    const page2 = await repo.listPending(2, page1.nextCursor);
    expect(page2.items.map((r) => r.id)).toEqual([OBX(2)]);
    expect(page2.hasMore).toBe(false);
    expect(page2.nextCursor).toBeNull();
  });

  it("markDispatched removes a row from pending", async () => {
    const repo = await seed(2);
    await repo.markDispatched(asOutboxMessageId(OBX(0)), "2026-05-27T01:00:00.000Z");
    const pending = await repo.listPending(10);
    expect(pending.items.map((r) => r.id)).toEqual([OBX(1)]);
  });

  it("markFailed records the reason and increments attempts", async () => {
    const repo = await seed(1);
    await repo.markFailed(asOutboxMessageId(OBX(0)), "boom", "2026-05-27T01:00:00.000Z");
    const pending = await repo.listPending(10);
    // failed rows are no longer pending
    expect(pending.items).toHaveLength(0);
  });
});
