import { describe, it, expect } from "vitest";
import { toMediaAssetDTO, toMediaVariantDTO } from "../mapper";
import type { MediaAssetRecord, MediaVariantRecord } from "../internal/record";

const record: MediaAssetRecord = {
  assetId: "a-1",
  ownerUserId: "user-1",
  ownerType: "user_profile",
  ownerId: "user-1",
  purpose: "profile_avatar",
  originalFilename: "selfie.png",
  provider: "supabase-storage",
  storageKey: "user_profile/user-1/profile_avatar/a-1",
  publicUrl: "https://cdn.test/user_profile/user-1/profile_avatar/a-1",
  cdnUrl: null,
  mimeType: "image/png",
  sizeBytes: 4096,
  width: 256,
  height: 256,
  durationSeconds: null,
  status: "ready",
  visibility: "public",
  createdAt: "2026-05-25T00:00:00.000Z",
  updatedAt: "2026-05-25T00:00:00.000Z",
  deletedAt: null,
};

const variant: MediaVariantRecord = {
  variantId: "v-1",
  assetId: "a-1",
  variantType: "avatar",
  width: 128,
  height: 128,
  storageKey: "user_profile/user-1/profile_avatar/a-1/avatar",
  url: "https://cdn.test/user_profile/user-1/profile_avatar/a-1/avatar",
  status: "ready",
  createdAt: "2026-05-25T00:00:00.000Z",
  updatedAt: "2026-05-25T00:00:00.000Z",
};

describe("media public mapper — no internal/PII leak", () => {
  it("public asset DTO exposes only public-safe fields", () => {
    const dto = toMediaAssetDTO(record, [variant]);
    expect(Object.keys(dto).sort()).toEqual(
      [
        "assetId",
        "purpose",
        "ownerType",
        "status",
        "visibility",
        "url",
        "mimeType",
        "width",
        "height",
        "durationSeconds",
        "variants",
      ].sort(),
    );
  });

  it("public asset DTO never carries storage internals, owner id or filename", () => {
    const dto = toMediaAssetDTO(record, [variant]) as Record<string, unknown>;
    expect(dto.provider).toBeUndefined();
    expect(dto.storageKey).toBeUndefined();
    expect(dto.ownerId).toBeUndefined();
    expect(dto.ownerUserId).toBeUndefined();
    expect(dto.sizeBytes).toBeUndefined();
    expect(dto.originalFilename).toBeUndefined();
    expect(dto.deletedAt).toBeUndefined();
  });

  it("variant DTO never carries the variant storage key", () => {
    const dto = toMediaVariantDTO(variant) as Record<string, unknown>;
    expect(dto.storageKey).toBeUndefined();
    expect(dto.variantId).toBeUndefined();
  });

  it("url is only surfaced when the asset is ready", () => {
    expect(toMediaAssetDTO({ ...record, status: "processing" }).url).toBeNull();
    expect(toMediaAssetDTO({ ...record, status: "ready" }).url).toBe(record.publicUrl);
  });
});
