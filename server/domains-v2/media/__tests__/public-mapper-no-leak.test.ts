import { describe, it, expect } from "vitest";
import { toMediaAssetDTO } from "../mapper";
import type { MediaAssetRecord } from "../internal/record";

const record: MediaAssetRecord = {
  assetId: "a-1",
  ownerType: "user",
  ownerId: "user-1",
  purpose: "avatar",
  provider: "supabase-storage",
  storageKey: "user/user-1/avatar/a-1",
  publicUrl: "https://cdn.test/user/user-1/avatar/a-1",
  mimeType: "image/png",
  sizeBytes: 4096,
  width: 256,
  height: 256,
  status: "ready",
  createdAt: "2026-05-25T00:00:00.000Z",
  updatedAt: "2026-05-25T00:00:00.000Z",
};

describe("media public mapper — no internal/PII leak", () => {
  it("public asset DTO exposes only public-safe fields", () => {
    const dto = toMediaAssetDTO(record);
    expect(Object.keys(dto).sort()).toEqual(
      ["assetId", "height", "mimeType", "purpose", "status", "url", "width"].sort(),
    );
  });

  it("public asset DTO never carries storage internals or owner id", () => {
    const dto = toMediaAssetDTO(record) as Record<string, unknown>;
    expect(dto.provider).toBeUndefined();
    expect(dto.storageKey).toBeUndefined();
    expect(dto.ownerId).toBeUndefined();
    expect(dto.sizeBytes).toBeUndefined();
  });

  it("url is only surfaced when the asset is ready", () => {
    expect(toMediaAssetDTO({ ...record, status: "pending" }).url).toBeNull();
    expect(toMediaAssetDTO({ ...record, status: "ready" }).url).toBe(record.publicUrl);
  });
});
