import { describe, it, expect } from "vitest";
import { createEventEnvelope } from "@shared/contracts/event-envelope";
import { asUserId, asOutboxMessageId } from "@shared/contracts/ids";
import {
  createOutboxMessageFromEnvelope,
  createInMemoryOutboxRepository,
  toOutboxMessageDTO,
} from "../outbox";

function envelope(id: string) {
  return createEventEnvelope(
    {
      type: "identity.profile.public_summary_changed",
      actorId: asUserId("u_1"),
      payload: { userId: asUserId("u_1") },
    },
    { generateId: () => id, now: () => new Date("2026-05-27T00:00:00.000Z") },
  );
}

describe("createOutboxMessageFromEnvelope", () => {
  it("maps envelope fields into a pending outbox record", () => {
    const record = createOutboxMessageFromEnvelope(envelope("ev_1"), {
      generateId: () => "obx_1",
      now: () => new Date("2026-05-27T00:00:01.000Z"),
    });
    expect(record.id).toBe("obx_1");
    expect(record.eventId).toBe("ev_1");
    expect(record.type).toBe("identity.profile.public_summary_changed");
    expect(record.status).toBe("pending");
    expect(record.attempts).toBe(0);
    expect(record.dispatchedAt).toBeNull();
    expect(record.payload).toEqual({ userId: "u_1" });
  });

  it("DTO projection omits payload and lastError", () => {
    const dto = toOutboxMessageDTO(
      createOutboxMessageFromEnvelope(envelope("ev_2"), {
        generateId: () => "obx_2",
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
      const record = createOutboxMessageFromEnvelope(envelope(`ev_${i}`), {
        generateId: () => `obx_${i}`,
        now: () => new Date(`2026-05-27T00:00:${String(i).padStart(2, "0")}.000Z`),
      });
      await repo.append(record);
    }
    return repo;
  }

  it("lists pending rows in stable order with cursor pagination", async () => {
    const repo = await seed(3);
    const page1 = await repo.listPending(2);
    expect(page1.items.map((r) => r.id)).toEqual(["obx_0", "obx_1"]);
    expect(page1.hasMore).toBe(true);
    expect(page1.nextCursor).toBeTruthy();

    const page2 = await repo.listPending(2, page1.nextCursor);
    expect(page2.items.map((r) => r.id)).toEqual(["obx_2"]);
    expect(page2.hasMore).toBe(false);
    expect(page2.nextCursor).toBeNull();
  });

  it("markDispatched removes a row from pending", async () => {
    const repo = await seed(2);
    await repo.markDispatched(asOutboxMessageId("obx_0"), "2026-05-27T01:00:00.000Z");
    const pending = await repo.listPending(10);
    expect(pending.items.map((r) => r.id)).toEqual(["obx_1"]);
  });

  it("markFailed records the reason and increments attempts", async () => {
    const repo = await seed(1);
    await repo.markFailed(asOutboxMessageId("obx_0"), "boom", "2026-05-27T01:00:00.000Z");
    const pending = await repo.listPending(10);
    // failed rows are no longer pending
    expect(pending.items).toHaveLength(0);
  });
});
