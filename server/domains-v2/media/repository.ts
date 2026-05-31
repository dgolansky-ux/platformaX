/**
 * media — repository + storage port contracts (with in-memory/env-required adapters)
 *
 * QUALITY_STRUCTURE_EXCEPTION: Slice 18 keeps the asset/intent/variant
 * port interfaces + in-memory implementation factories + env-required
 * storage port in the canonical repository.ts so the boundary guard's
 * single allow-list (`./repository`) keeps working unchanged. Splitting
 * implementations would require widening that allow-list and force the
 * composition code (today: tests; tomorrow: HTTP wiring) to deep-import
 * across multiple module names. Tracked as EXC-009 in
 * docs/governance/EXCEPTIONS_REGISTER.md.
 *
 * Persistence and the storage backend are both abstracted behind interfaces.
 * The current runtime ships:
 *  - an in-memory `MediaRepository` (metadata + variant skeleton — never file bytes),
 *  - an in-memory `UploadIntentRepository` (with idempotency + expiry checks),
 *  - an `EnvRequired` `MediaStoragePort` that issues NO real upload URL.
 *
 * No Supabase Storage client and no live bucket are wired yet
 * (STORAGE_ADAPTER_ENV_REQUIRED). The SQL schema mirror lives in
 * `supabase/migrations/0002_media_assets.sql` (assets) and
 * `supabase/migrations/0008_media_v2_expansion.sql` (variants + intents) and is
 * NOT applied anywhere.
 */
import type {
  MediaAssetStatus,
  MediaOwnerType,
  MediaPurpose,
  MediaVariantStatus,
  MediaVariantType,
  MediaVisibility,
  UploadTransportState,
} from "@shared/contracts/media";
import type {
  MediaAssetRecord,
  MediaVariantRecord,
  UploadIntentRecord,
  UploadIntentStatus,
} from "./internal/record";

export type CreateMediaRecordInput = {
  assetId: string;
  ownerUserId: string;
  ownerType: MediaOwnerType;
  ownerId: string;
  purpose: MediaPurpose;
  originalFilename: string | null;
  provider: string;
  storageKey: string;
  publicUrl: string | null;
  cdnUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  status: MediaAssetStatus;
  visibility: MediaVisibility;
};

export type UpdateMediaRecordPatch = {
  publicUrl?: string | null;
  cdnUrl?: string | null;
  status?: MediaAssetStatus;
  visibility?: MediaVisibility;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
};

export type CreateVariantInput = {
  variantId: string;
  assetId: string;
  variantType: MediaVariantType;
  status: MediaVariantStatus;
  width: number | null;
  height: number | null;
  storageKey: string | null;
  url: string | null;
};

export interface MediaRepository {
  create(input: CreateMediaRecordInput, now: string): Promise<MediaAssetRecord>;
  findById(assetId: string): Promise<MediaAssetRecord | null>;
  update(
    assetId: string,
    patch: UpdateMediaRecordPatch,
    now: string,
  ): Promise<MediaAssetRecord | null>;
  softDelete(assetId: string, now: string): Promise<MediaAssetRecord | null>;
  findByOwner(
    ownerType: MediaOwnerType,
    ownerId: string,
  ): Promise<readonly MediaAssetRecord[]>;
  createVariants(
    variants: readonly CreateVariantInput[],
    now: string,
  ): Promise<readonly MediaVariantRecord[]>;
  findVariantsForAsset(assetId: string): Promise<readonly MediaVariantRecord[]>;
}

export type CreateUploadIntentRecordInput = {
  intentId: string;
  actorUserId: string;
  ownerType: MediaOwnerType;
  ownerId: string;
  purpose: MediaPurpose;
  allowedMimeTypes: readonly string[];
  maxSizeBytes: number;
  maxFiles: number;
  expiresAt: string;
  idempotencyKey: string;
  assetId: string;
};

export interface UploadIntentRepository {
  create(input: CreateUploadIntentRecordInput, now: string): Promise<UploadIntentRecord>;
  findById(intentId: string): Promise<UploadIntentRecord | null>;
  findByIdempotency(
    actorUserId: string,
    idempotencyKey: string,
  ): Promise<UploadIntentRecord | null>;
  markStatus(
    intentId: string,
    status: UploadIntentStatus,
    now: string,
  ): Promise<UploadIntentRecord | null>;
}

/** Result of asking the storage backend for an upload destination. */
export type UploadTarget = {
  provider: string;
  uploadUrl: string | null;
  publicUrl: string | null;
  cdnUrl: string | null;
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
  const variantsByAsset = new Map<string, MediaVariantRecord[]>();
  for (const r of seed) byId.set(r.assetId, { ...r });

  return {
    async create(input, now) {
      const record: MediaAssetRecord = {
        assetId: input.assetId,
        ownerUserId: input.ownerUserId,
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        purpose: input.purpose,
        originalFilename: input.originalFilename,
        provider: input.provider,
        storageKey: input.storageKey,
        publicUrl: input.publicUrl,
        cdnUrl: input.cdnUrl,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        width: input.width,
        height: input.height,
        durationSeconds: input.durationSeconds,
        status: input.status,
        visibility: input.visibility,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      byId.set(record.assetId, record);
      return { ...record };
    },

    async findById(assetId) {
      const record = byId.get(assetId);
      if (!record) return null;
      if (record.deletedAt) return null;
      return { ...record };
    },

    async update(assetId, patch, now) {
      const existing = byId.get(assetId);
      if (!existing) return null;
      if (existing.deletedAt) return null;
      const next: MediaAssetRecord = { ...existing, ...patch, updatedAt: now };
      byId.set(assetId, next);
      return { ...next };
    },

    async softDelete(assetId, now) {
      const existing = byId.get(assetId);
      if (!existing) return null;
      const next: MediaAssetRecord = {
        ...existing,
        status: "deleted",
        updatedAt: now,
        deletedAt: now,
      };
      byId.set(assetId, next);
      return { ...next };
    },

    async findByOwner(ownerType, ownerId) {
      const out: MediaAssetRecord[] = [];
      for (const r of byId.values()) {
        if (r.deletedAt) continue;
        if (r.ownerType === ownerType && r.ownerId === ownerId) out.push({ ...r });
      }
      return out;
    },

    async createVariants(variants, now) {
      const out: MediaVariantRecord[] = [];
      for (const v of variants) {
        const record: MediaVariantRecord = {
          variantId: v.variantId,
          assetId: v.assetId,
          variantType: v.variantType,
          width: v.width,
          height: v.height,
          storageKey: v.storageKey,
          url: v.url,
          status: v.status,
          createdAt: now,
          updatedAt: now,
        };
        const list = variantsByAsset.get(v.assetId) ?? [];
        list.push(record);
        variantsByAsset.set(v.assetId, list);
        out.push({ ...record });
      }
      return out;
    },

    async findVariantsForAsset(assetId) {
      const list = variantsByAsset.get(assetId) ?? [];
      return list.map((v) => ({ ...v }));
    },
  };
}

/** Deterministic in-memory upload intent store. */
export function createInMemoryUploadIntentRepository(): UploadIntentRepository {
  const byId = new Map<string, UploadIntentRecord>();
  const byIdempotency = new Map<string, string>();

  function idempotencyComposite(actor: string, key: string): string {
    return `${actor}::${key}`;
  }

  return {
    async create(input, now) {
      const record: UploadIntentRecord = {
        intentId: input.intentId,
        actorUserId: input.actorUserId,
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        purpose: input.purpose,
        allowedMimeTypes: input.allowedMimeTypes,
        maxSizeBytes: input.maxSizeBytes,
        maxFiles: input.maxFiles,
        expiresAt: input.expiresAt,
        status: "active",
        idempotencyKey: input.idempotencyKey,
        assetId: input.assetId,
        createdAt: now,
        usedAt: null,
      };
      byId.set(record.intentId, record);
      byIdempotency.set(
        idempotencyComposite(record.actorUserId, record.idempotencyKey),
        record.intentId,
      );
      return { ...record };
    },

    async findById(intentId) {
      const r = byId.get(intentId);
      return r ? { ...r } : null;
    },

    async findByIdempotency(actorUserId, idempotencyKey) {
      const intentId = byIdempotency.get(idempotencyComposite(actorUserId, idempotencyKey));
      if (!intentId) return null;
      const r = byId.get(intentId);
      return r ? { ...r } : null;
    },

    async markStatus(intentId, status, now) {
      const existing = byId.get(intentId);
      if (!existing) return null;
      const next: UploadIntentRecord = {
        ...existing,
        status,
        usedAt: status === "used" ? now : existing.usedAt,
      };
      byId.set(intentId, next);
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
        cdnUrl: null,
        transport: "ENV_REQUIRED",
        expiresAt: null,
      };
    },
  };
}
