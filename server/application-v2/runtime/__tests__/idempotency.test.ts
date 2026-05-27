import { describe, it, expect } from "vitest";
import { asIdempotencyKey } from "@shared/contracts/ids";
import { createInMemoryIdempotencyRepository } from "../idempotency";

const KEY = asIdempotencyKey("idem-123");
const SCOPE = "media.confirmUpload";
const NOW = "2026-05-27T00:00:00.000Z";
const EXPIRES = "2026-05-28T00:00:00.000Z";

describe("idempotency repository", () => {
  it("reserve creates a reserved record findable by key+scope", async () => {
    const repo = createInMemoryIdempotencyRepository();
    const reserved = await repo.reserve(KEY, SCOPE, "req-hash", NOW, EXPIRES);
    expect(reserved.status).toBe("reserved");
    expect(reserved.key).toBe("idem-123");
    expect(reserved.scope).toBe(SCOPE);
    expect(reserved.responseHash).toBeNull();
    expect(reserved.expiresAt).toBe(EXPIRES);

    const found = await repo.find(KEY, SCOPE);
    expect(found?.status).toBe("reserved");
  });

  it("storeResult marks the record completed with a response hash", async () => {
    const repo = createInMemoryIdempotencyRepository();
    await repo.reserve(KEY, SCOPE, "req-hash", NOW, EXPIRES);
    await repo.storeResult(KEY, SCOPE, "resp-hash", "completed", NOW);
    const found = await repo.find(KEY, SCOPE);
    expect(found?.status).toBe("completed");
    expect(found?.responseHash).toBe("resp-hash");
  });

  it("releaseFailed marks the record failed", async () => {
    const repo = createInMemoryIdempotencyRepository();
    await repo.reserve(KEY, SCOPE, "req-hash", NOW, EXPIRES);
    await repo.releaseFailed(KEY, SCOPE, NOW);
    const found = await repo.find(KEY, SCOPE);
    expect(found?.status).toBe("failed");
  });

  it("the same key under a different scope is independent", async () => {
    const repo = createInMemoryIdempotencyRepository();
    await repo.reserve(KEY, SCOPE, "h", NOW, EXPIRES);
    expect(await repo.find(KEY, "identity.completeOnboarding")).toBeNull();
  });
});
