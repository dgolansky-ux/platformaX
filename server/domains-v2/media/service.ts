/**
 * media — service (use-cases)
 *
 * ALLOW_FILE_SIZE_EXCEPTION: see EXC-009.
 * QUALITY_STRUCTURE_EXCEPTION: Slice 18 keeps all 6 V2 media use-cases
 * (createUploadIntent / completeUpload / getPublicMediaUrl /
 * listAssetsForOwner / deleteMediaAssetSoft / verifyOwnedAssetForAttach) in
 * the canonical service.ts so the cross-domain wiring sees a single
 * `createMediaService` factory. Splitting per-use-case would fragment shared
 * helpers (validation, intent context, variant skeleton) and the composition
 * factory. Tracked as EXC-009 in docs/governance/EXCEPTIONS_REGISTER.md;
 * planned for a follow-up refactor once the live storage adapter lands.
 *
 * Generic V2 surface. One pair of upload primitives covers every purpose:
 *  - createUploadIntent(input)   — purpose + ownerRef + idempotency-guarded
 *  - completeUpload(input)       — finalises the asset; honest STORAGE_UNAVAILABLE
 *                                  while no real storage backend is wired
 * plus the read/list/delete/verify helpers other domains need.
 *
 * Depends on `MediaRepository`, `UploadIntentRepository` and `MediaStoragePort`
 * (interfaces) plus the purpose registry, validation, policy and the mapper.
 * No storage SDK is referenced here — a concrete adapter is injected.
 *
 * Variants today are created with `processing_skeleton` status (no real image
 * processing pipeline). Surfaces fall back to the best available variant; we
 * never invent a thumbnail URL we cannot serve.
 */
import type {
  CompleteUploadInput,
  CreateUploadIntentInput,
  MediaAssetDTO,
  MediaError,
  MediaErrorCode,
  MediaOwnerRefDTO,
  MediaPurpose,
  MediaPurposeDefinitionDTO,
  MediaRefDTO,
  MediaResult,
  UploadIntentDTO,
} from "@shared/contracts/media";
import { wrapMediaEvent, type MediaEventEnvelope } from "./internal/envelope";
import {
  validateOwnerType,
  validatePurpose,
  validateUploadFileMeta,
} from "./internal/validation";
import { toMediaAssetDTO, toUploadIntentDTO } from "./mapper";
import { canCreateUploadIntent } from "./policy";
import {
  buildStoragePath,
  getPurposeDefinition,
  isMediaPurpose,
  listPurposeDefinitions,
} from "./purpose-registry";
import type {
  CreateVariantInput,
  MediaRepository,
  MediaStoragePort,
  UploadIntentRepository,
} from "./repository";

export type MediaClock = () => string;
export type MediaIdGenerator = () => string;
export type MediaEventPublisher = (envelope: MediaEventEnvelope) => void;

const DEFAULT_INTENT_TTL_SECONDS = 15 * 60;

export type MediaServiceDeps = {
  repository: MediaRepository;
  intentRepository: UploadIntentRepository;
  storage: MediaStoragePort;
  clock?: MediaClock;
  idGen?: MediaIdGenerator;
  publish?: MediaEventPublisher;
  intentTtlSeconds?: number;
};

export interface MediaService {
  getPurposeDefinition(purpose: MediaPurpose): MediaPurposeDefinitionDTO;
  listPurposeDefinitions(): readonly MediaPurposeDefinitionDTO[];

  createUploadIntent(
    input: CreateUploadIntentInput,
  ): Promise<MediaResult<UploadIntentDTO>>;

  completeUpload(input: CompleteUploadInput): Promise<MediaResult<MediaAssetDTO>>;

  getPublicMediaUrl(ref: MediaRefDTO): Promise<MediaResult<MediaAssetDTO>>;

  listAssetsForOwner(
    ownerRef: MediaOwnerRefDTO,
  ): Promise<MediaResult<readonly MediaAssetDTO[]>>;

  deleteMediaAssetSoft(
    actorUserId: string,
    assetId: string,
  ): Promise<MediaResult<MediaAssetDTO>>;

  /**
   * Verify that `assetId` belongs to `actorUserId`, has the expected `purpose`
   * and is `ready`, before another domain attaches it as a profile/post ref.
   * Returns the public-safe DTO. Never leaks `ownerId`/`storageKey`.
   */
  verifyOwnedAssetForAttach(
    actorUserId: string,
    assetId: string,
    purpose: MediaPurpose,
  ): Promise<MediaResult<MediaAssetDTO>>;
}

type ServiceContext = {
  repo: MediaRepository;
  intents: UploadIntentRepository;
  storage: MediaStoragePort;
  clock: MediaClock;
  idGen: MediaIdGenerator;
  publish: MediaEventPublisher;
  intentTtlSeconds: number;
};

function fail(code: MediaErrorCode, message: string, fields?: Record<string, string>): MediaError {
  return fields ? { code, message, fields } : { code, message };
}

function codeForFieldErrors(fields: Record<string, string>): MediaErrorCode {
  if (fields.purpose) return "INVALID_PURPOSE";
  if (fields.ownerType) return "INVALID_OWNER_TYPE";
  if (fields.mimeType) return "UNSUPPORTED_TYPE";
  if (fields.sizeBytes) return "TOO_LARGE";
  if (fields.maxFiles) return "TOO_MANY_FILES";
  return "INVALID_INPUT";
}

function defaultIdGen(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  throw new Error(
    "MEDIA_ID_GEN_UNAVAILABLE: crypto.randomUUID() is required. " +
      "Inject a deterministic idGen via MediaServiceDeps.idGen in tests.",
  );
}

function addSecondsIso(iso: string, seconds: number): string {
  return new Date(new Date(iso).getTime() + seconds * 1000).toISOString();
}

function isExpired(iso: string, now: string): boolean {
  return new Date(iso).getTime() <= new Date(now).getTime();
}

function buildVariantSkeleton(
  ctx: ServiceContext,
  assetId: string,
  definition: MediaPurposeDefinitionDTO,
): readonly CreateVariantInput[] {
  return definition.variantPolicy.map((variantType) => ({
    variantId: ctx.idGen(),
    assetId,
    variantType,
    status: variantType === "original" ? "ready" : "processing_skeleton",
    width: null,
    height: null,
    storageKey: null,
    url: null,
  }));
}

async function buildUploadIntent(
  ctx: ServiceContext,
  input: CreateUploadIntentInput,
): Promise<MediaResult<UploadIntentDTO>> {
  if (!input.actorUserId) {
    return { ok: false, error: fail("FORBIDDEN", "Wymagane zalogowanie") };
  }
  if (!canCreateUploadIntent("owner")) {
    return { ok: false, error: fail("FORBIDDEN", "Brak uprawnień") };
  }

  const purposeErrors = validatePurpose(input.purpose);
  if (Object.keys(purposeErrors).length > 0) {
    return {
      ok: false,
      error: fail("INVALID_PURPOSE", "Nieznany typ medium", purposeErrors),
    };
  }
  if (!isMediaPurpose(input.purpose)) {
    return { ok: false, error: fail("INVALID_PURPOSE", "Nieznany typ medium") };
  }

  const ownerErrors = validateOwnerType(input.purpose, input.ownerRef.ownerType);
  if (Object.keys(ownerErrors).length > 0) {
    return {
      ok: false,
      error: fail("INVALID_OWNER_TYPE", ownerErrors.ownerType ?? "Niepoprawny właściciel", ownerErrors),
    };
  }
  if (!input.ownerRef.ownerId) {
    return { ok: false, error: fail("INVALID_INPUT", "Brak identyfikatora właściciela") };
  }
  if (!input.idempotencyKey || input.idempotencyKey.trim().length === 0) {
    return { ok: false, error: fail("INVALID_INPUT", "Brak idempotencyKey") };
  }

  const fileErrors = validateUploadFileMeta(input.purpose, input.fileMeta);
  if (Object.keys(fileErrors).length > 0) {
    const firstMessage = Object.values(fileErrors)[0] ?? "Niepoprawny plik";
    return { ok: false, error: fail(codeForFieldErrors(fileErrors), firstMessage, fileErrors) };
  }

  // Idempotency replay: same actor + key returns the already-created intent.
  const existing = await ctx.intents.findByIdempotency(input.actorUserId, input.idempotencyKey);
  if (existing) {
    const asset = await ctx.repo.findById(existing.assetId);
    if (asset) {
      const target = await ctx.storage.createUploadTarget({
        storageKey: asset.storageKey,
        mimeType: asset.mimeType,
        maxBytes: existing.maxSizeBytes,
      });
      return { ok: true, value: toUploadIntentDTO(existing, asset, target, asset.mimeType) };
    }
  }

  const definition = getPurposeDefinition(input.purpose);
  const assetId = ctx.idGen();
  const intentId = ctx.idGen();
  const storageKey = buildStoragePath(
    input.ownerRef.ownerType,
    input.ownerRef.ownerId,
    input.purpose,
    assetId,
  );
  const target = await ctx.storage.createUploadTarget({
    storageKey,
    mimeType: input.fileMeta.mimeType,
    maxBytes: definition.maxSizeBytes,
  });

  const now = ctx.clock();
  const expiresAt = addSecondsIso(now, ctx.intentTtlSeconds);

  const record = await ctx.repo.create(
    {
      assetId,
      ownerUserId: input.actorUserId,
      ownerType: input.ownerRef.ownerType,
      ownerId: input.ownerRef.ownerId,
      purpose: input.purpose,
      originalFilename: null,
      provider: target.provider,
      storageKey,
      publicUrl: target.publicUrl,
      cdnUrl: target.cdnUrl,
      mimeType: input.fileMeta.mimeType,
      sizeBytes: input.fileMeta.sizeBytes,
      width: input.fileMeta.width ?? null,
      height: input.fileMeta.height ?? null,
      durationSeconds: null,
      status: "upload_intent_created",
      visibility: definition.defaultVisibility,
    },
    now,
  );

  const intent = await ctx.intents.create(
    {
      intentId,
      actorUserId: input.actorUserId,
      ownerType: input.ownerRef.ownerType,
      ownerId: input.ownerRef.ownerId,
      purpose: input.purpose,
      allowedMimeTypes: definition.allowedMimeTypes,
      maxSizeBytes: definition.maxSizeBytes,
      maxFiles: definition.maxFiles,
      expiresAt,
      idempotencyKey: input.idempotencyKey,
      assetId,
    },
    now,
  );

  ctx.publish(
    wrapMediaEvent({
      type: "media.upload.intent_created",
      assetId,
      intentId,
      ownerId: input.ownerRef.ownerId,
      ownerType: input.ownerRef.ownerType,
      at: now,
    }),
  );

  return { ok: true, value: toUploadIntentDTO(intent, record, target, input.fileMeta.mimeType) };
}

export function createMediaService(deps: MediaServiceDeps): MediaService {
  const ctx: ServiceContext = {
    repo: deps.repository,
    intents: deps.intentRepository,
    storage: deps.storage,
    clock: deps.clock ?? (() => new Date().toISOString()),
    idGen: deps.idGen ?? defaultIdGen,
    publish: deps.publish ?? (() => {}),
    intentTtlSeconds: deps.intentTtlSeconds ?? DEFAULT_INTENT_TTL_SECONDS,
  };

  return {
    getPurposeDefinition,
    listPurposeDefinitions,

    createUploadIntent: (input) => buildUploadIntent(ctx, input),

    async completeUpload(input) {
      if (!input.actorUserId) {
        return { ok: false, error: fail("FORBIDDEN", "Wymagane zalogowanie") };
      }
      const intent = await ctx.intents.findById(input.intentId);
      if (!intent) {
        return { ok: false, error: fail("NOT_FOUND", "Brak intencji uploadu") };
      }
      if (intent.actorUserId !== input.actorUserId) {
        return { ok: false, error: fail("FORBIDDEN", "Brak uprawnień do intencji") };
      }
      if (intent.assetId !== input.assetId) {
        return { ok: false, error: fail("INVALID_INPUT", "Niezgodny zasób") };
      }
      const now = ctx.clock();
      if (intent.status === "used") {
        return { ok: false, error: fail("INTENT_ALREADY_USED", "Intencja już wykorzystana") };
      }
      if (intent.status !== "active") {
        return { ok: false, error: fail("INTENT_EXPIRED", "Intencja wygasła lub anulowana") };
      }
      if (isExpired(intent.expiresAt, now)) {
        await ctx.intents.markStatus(intent.intentId, "expired", now);
        return { ok: false, error: fail("INTENT_EXPIRED", "Intencja wygasła") };
      }

      const record = await ctx.repo.findById(input.assetId);
      if (!record) return { ok: false, error: fail("NOT_FOUND", "Zasób nie istnieje") };
      if (record.ownerUserId !== input.actorUserId) {
        return { ok: false, error: fail("FORBIDDEN", "Brak uprawnień do zasobu") };
      }

      // Honest STORAGE_UNAVAILABLE while no real backend wired:
      // we never accept the asset as `ready` if the storage port could not
      // give us a usable URL.
      if (!record.publicUrl && !record.cdnUrl) {
        return {
          ok: false,
          error: fail(
            "STORAGE_UNAVAILABLE",
            "Przechowywanie plików nie jest jeszcze podłączone",
          ),
        };
      }

      const definition = getPurposeDefinition(record.purpose);
      const updated = await ctx.repo.update(input.assetId, { status: "ready" }, now);
      if (!updated) return { ok: false, error: fail("NOT_FOUND", "Zasób nie istnieje") };

      const variants = await ctx.repo.createVariants(
        buildVariantSkeleton(ctx, input.assetId, definition),
        now,
      );

      await ctx.intents.markStatus(intent.intentId, "used", now);

      ctx.publish(
        wrapMediaEvent({
          type: "media.upload.confirmed",
          assetId: input.assetId,
          intentId: intent.intentId,
          ownerId: record.ownerId,
          ownerType: record.ownerType,
          at: now,
        }),
      );

      return { ok: true, value: toMediaAssetDTO(updated, variants) };
    },

    async getPublicMediaUrl(ref) {
      const record = await ctx.repo.findById(ref.assetId);
      if (!record) return { ok: false, error: fail("NOT_FOUND", "Zasób nie istnieje") };
      const variants = await ctx.repo.findVariantsForAsset(ref.assetId);
      return { ok: true, value: toMediaAssetDTO(record, variants) };
    },

    async listAssetsForOwner(ownerRef) {
      if (!ownerRef.ownerId) {
        return { ok: false, error: fail("INVALID_INPUT", "Brak identyfikatora właściciela") };
      }
      const records = await ctx.repo.findByOwner(ownerRef.ownerType, ownerRef.ownerId);
      const out: MediaAssetDTO[] = [];
      for (const r of records) {
        const variants = await ctx.repo.findVariantsForAsset(r.assetId);
        out.push(toMediaAssetDTO(r, variants));
      }
      return { ok: true, value: out };
    },

    async deleteMediaAssetSoft(actorUserId, assetId) {
      if (!actorUserId) {
        return { ok: false, error: fail("FORBIDDEN", "Wymagane zalogowanie") };
      }
      const record = await ctx.repo.findById(assetId);
      if (!record) return { ok: false, error: fail("NOT_FOUND", "Zasób nie istnieje") };
      if (record.ownerUserId !== actorUserId) {
        return { ok: false, error: fail("FORBIDDEN", "Brak uprawnień do zasobu") };
      }
      const now = ctx.clock();
      const updated = await ctx.repo.softDelete(assetId, now);
      if (!updated) return { ok: false, error: fail("NOT_FOUND", "Zasób nie istnieje") };
      ctx.publish(
        wrapMediaEvent({
          type: "media.asset.deleted",
          assetId,
          ownerId: record.ownerId,
          ownerType: record.ownerType,
          at: now,
        }),
      );
      return { ok: true, value: toMediaAssetDTO(updated) };
    },

    async verifyOwnedAssetForAttach(actorUserId, assetId, purpose) {
      if (!actorUserId) {
        return { ok: false, error: fail("FORBIDDEN", "Wymagane zalogowanie") };
      }
      const record = await ctx.repo.findById(assetId);
      if (!record) return { ok: false, error: fail("NOT_FOUND", "Zasób nie istnieje") };
      if (record.ownerUserId !== actorUserId) {
        return { ok: false, error: fail("FORBIDDEN", "Brak uprawnień do zasobu") };
      }
      if (record.purpose !== purpose) {
        return {
          ok: false,
          error: fail("INVALID_INPUT", "Typ zasobu nie pasuje do żądanej referencji"),
        };
      }
      if (record.status !== "ready") {
        return {
          ok: false,
          error: fail("NOT_READY", "Zasób nie jest jeszcze gotowy do podpięcia"),
        };
      }
      const variants = await ctx.repo.findVariantsForAsset(assetId);
      return { ok: true, value: toMediaAssetDTO(record, variants) };
    },
  };
}
