import { describe, expect, it } from "vitest";
import { createInMemoryIdentityProfileRepository } from "../repository";
import type { CreateProfileRecordInput } from "../repository";

const NOW = "2026-05-25T12:00:00.000Z";
const LATER = "2026-05-25T13:00:00.000Z";

const BASE_INPUT: CreateProfileRecordInput = {
  userId: "u-1",
  firstName: "Anna",
  lastName: "Kowalska",
  dateOfBirth: "1990-03-15",
  phone: "+48600999111",
  avatarAssetId: null,
  bannerAssetId: null,
  bio: null,
  location: null,
  profileSlug: null,
  statusText: null,
  statusEmoji: null,
  statusDescription: null,
  statusVisibility: null,
  statusPhotoAssetId: null,
  civilStatus: null,
  socialLinks: null,
  visibility: "public",
  onboardingCompleted: true,
};

describe("in-memory identity profile repository", () => {
  it("creates and finds a record by userId", async () => {
    const repo = createInMemoryIdentityProfileRepository();
    const created = await repo.create(BASE_INPUT, NOW);
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
    await repo.create(BASE_INPUT, NOW);
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

  it("update never silently nulls fields that are omitted from the patch", async () => {
    const repo = createInMemoryIdentityProfileRepository();
    await repo.create(
      { ...BASE_INPUT, bio: "original", location: "Kraków" },
      NOW,
    );
    const updated = await repo.update("u-1", { bio: "new bio" }, LATER);
    expect(updated?.bio).toBe("new bio");
    // location was NOT included in the patch — it must be preserved as-is.
    expect(updated?.location).toBe("Kraków");
  });

  it("findBySlug returns the matching record (case-sensitive)", async () => {
    const repo = createInMemoryIdentityProfileRepository();
    await repo.create({ ...BASE_INPUT, profileSlug: "anna-k" }, NOW);
    expect((await repo.findBySlug("anna-k"))?.userId).toBe("u-1");
    expect(await repo.findBySlug("anna-K")).toBeNull();
    expect(await repo.findBySlug("nobody")).toBeNull();
  });

  it("seeded records are isolated from internal map mutations", async () => {
    const seed = {
      ...BASE_INPUT,
      bio: "seed",
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
