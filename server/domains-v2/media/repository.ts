/**
 * media — repository + storage port contracts (with in-memory/env-required adapters)
 *
 * Persistence and the storage backend are both abstracted behind interfaces.
 * The current runtime ships:
 *  - an in-memory `MediaRepository` (metadata only — never file bytes),
 *  - an `EnvRequired` `MediaStoragePort` that issues NO real upload URL.
 *
 * No Supabase Storage client and no live bucket are wired yet
 * (STORAGE_ADAPTER_ENV_REQUIRED). The SQL schema mirror lives in
 * `supabase/migrations/0002_media_assets.sql` and is NOT applied anywhere.
 */
import type { MediaAssetStatus, MediaPurpose, UploadTransportState } from "./dto";
import type { MediaAssetRecord } from "./internal/record";

export type CreateMediaRecordInput = {
  assetId: string;
  ownerId: string;
  purpose: MediaPurpose;
  provider: string;
  storageKey: string;
  publicUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  status: MediaAssetStatus;
};

export type UpdateMediaRecordPatch = {
  publicUrl?: string | null;
  status?: MediaAssetStatus;
  width?: number | null;
  height?: number | null;
};

export interface MediaRepository {
  create(input: CreateMediaRecordInput, now: string): Promise<MediaAssetRecord>;
  findById(assetId: string): Promise<MediaAssetRecord | null>;
  update(
    assetId: string,
    patch: UpdateMediaRecordPatch,
    now: string,
  ): Promise<MediaAssetRecord | null>;
}

/** Result of asking the storage backend for an upload destination. */
export type UploadTarget = {
  provider: string;
  uploadUrl: string | null;
  publicUrl: string | null;
  transport: UploadTransportState;
  expiresAt: string | null;
};

export type UploadTargetRequest = {
  storageKey: string;
  mimeType: string;
  maxBytes: number;
};

/** Abstraction over the file storage backend (e.g. Supabase Storage, S3). */
export interface MediaStoragePort {
  readonly provider: string;
  isConnected(): boolean;
  createUploadTarget(req: UploadTargetRequest): Promise<UploadTarget>;
}

/** Deterministic in-memory metadata store. Safe for tests and the local boundary. */
export function createInMemoryMediaRepository(
  seed: ReadonlyArray<MediaAssetRecord> = [],
): MediaRepository {
  const byId = new Map<string, MediaAssetRecord>();
  for (const r of seed) byId.set(r.assetId, { ...r });

  return {
    async create(input, now) {
      const record: MediaAssetRecord = {
        assetId: input.assetId,
        ownerType: "user",
        ownerId: input.ownerId,
        purpose: input.purpose,
        provider: input.provider,
        storageKey: input.storageKey,
        publicUrl: input.publicUrl,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        width: input.width,
        height: input.height,
        status: input.status,
        createdAt: now,
        updatedAt: now,
      };
      byId.set(record.assetId, record);
      return { ...record };
    },

    async findById(assetId) {
      const record = byId.get(assetId);
      return record ? { ...record } : null;
    },

    async update(assetId, patch, now) {
      const existing = byId.get(assetId);
      if (!existing) return null;
      const next: MediaAssetRecord = { ...existing, ...patch, updatedAt: now };
      byId.set(assetId, next);
      return { ...next };
    },
  };
}

/**
 * Storage port used while no real backend is configured. It never invents an
 * upload URL — it reports `ENV_REQUIRED` so callers stay honest about the fact
 * that bytes cannot actually be stored yet.
 */
export function createEnvRequiredStoragePort(
  provider = "env-required",
): MediaStoragePort {
  return {
    provider,
    isConnected() {
      return false;
    },
    async createUploadTarget() {
      return {
        provider,
        uploadUrl: null,
        publicUrl: null,
        transport: "ENV_REQUIRED",
        expiresAt: null,
      };
    },
  };
}
