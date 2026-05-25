import { describe, expect, it } from "vitest";
import { createInMemoryIdentityProfileRepository } from "../public-api";

const NOW = "2026-05-25T12:00:00.000Z";
const LATER = "2026-05-25T13:00:00.000Z";

describe("in-memory identity profile repository", () => {
  it("creates and finds a record by userId", async () => {
    const repo = createInMemoryIdentityProfileRepository();
    const created = await repo.create(
      {
        userId: "u-1",
        firstName: "Anna",
        lastName: "Kowalska",
        dateOfBirth: "1990-03-15",
        phone: "+48600999111",
        avatarAssetId: null,
        bannerAssetId: null,
        bio: null,
        visibility: "public",
        onboardingCompleted: true,
      },
      NOW,
    );
    expect(created.createdAt).toBe(NOW);
    expect(created.updatedAt).toBe(NOW);
    const found = await repo.findByUserId("u-1");
    expect(found?.firstName).toBe("Anna");
  });

  it("returns null on missing user", async () => {
    const repo = createInMemoryIdentityProfileRepository();
    const found = await repo.findByUserId("ghost");
    expect(found).toBeNull();
  });

  it("update merges the patch and bumps updatedAt", async () => {
    const repo = createInMemoryIdentityProfileRepository();
    await repo.create(
      {
        userId: "u-1",
        firstName: "Anna",
        lastName: "Kowalska",
        dateOfBirth: "1990-03-15",
        phone: "+48600999111",
        avatarAssetId: null,
        bannerAssetId: null,
        bio: null,
        visibility: "public",
        onboardingCompleted: true,
      },
      NOW,
    );
    const updated = await repo.update("u-1", { bio: "linia 1" }, LATER);
    expect(updated?.bio).toBe("linia 1");
    expect(updated?.updatedAt).toBe(LATER);
    expect(updated?.createdAt).toBe(NOW);
  });

  it("update returns null when record is absent", async () => {
    const repo = createInMemoryIdentityProfileRepository();
    const result = await repo.update("ghost", { bio: "x" }, LATER);
    expect(result).toBeNull();
  });

  it("seeded records are isolated from internal map mutations", async () => {
    const seed = {
      userId: "u-1",
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
      avatarAssetId: null,
      bannerAssetId: null,
      bio: "seed",
      visibility: "public" as const,
      onboardingCompleted: true,
      createdAt: NOW,
      updatedAt: NOW,
    };
    const repo = createInMemoryIdentityProfileRepository([seed]);
    const found = await repo.findByUserId("u-1");
    if (!found) throw new Error("expected record");
    found.bio = "mutated externally";
    const second = await repo.findByUserId("u-1");
    expect(second?.bio).toBe("seed");
  });
});
