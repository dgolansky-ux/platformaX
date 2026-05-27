/**
 * media — service (use-cases)
 *
 * Owns the first media runtime slice:
 *  - createAvatarUploadIntent(userId, meta)
 *  - createBannerUploadIntent(userId, meta)
 *  - confirmProfileMediaUpload(userId, assetId)
 *  - getPublicMediaUrl(ref)
 *
 * Depends on `MediaRepository` and `MediaStoragePort` (interfaces) plus policy,
 * validation and mapper. No storage SDK is referenced here — a concrete adapter
 * is injected. With the env-required storage port, confirm honestly fails with
 * STORAGE_UNAVAILABLE instead of pretending an upload succeeded.
 */
import type {
  MediaError,
  MediaErrorCode,
  MediaResult,
  UploadFileMeta,
} from "./contracts";
import type { MediaAssetDTO, MediaPurpose, MediaRefDTO, UploadIntentDTO } from "./dto";
import type { MediaEvent } from "./events";
import { maxBytesFor, validateUploadFileMeta } from "./internal/validation";
import { toMediaAssetDTO, toUploadIntentDTO } from "./mapper";
import { canCreateUploadIntent } from "./policy";
import type { MediaRepository, MediaStoragePort } from "./repository";

export type MediaClock = () => string;
export type MediaIdGenerator = () => string;
export type MediaEventPublisher = (event: MediaEvent) => void;

export type MediaServiceDeps = {
  repository: MediaRepository;
  storage: MediaStoragePort;
  clock?: MediaClock;
  idGen?: MediaIdGenerator;
  publish?: MediaEventPublisher;
};

export interface MediaService {
  createAvatarUploadIntent(
    userId: string,
    meta: UploadFileMeta,
  ): Promise<MediaResult<UploadIntentDTO>>;
  createBannerUploadIntent(
    userId: string,
    meta: UploadFileMeta,
  ): Promise<MediaResult<UploadIntentDTO>>;
  createStatusPhotoUploadIntent(
    userId: string,
    meta: UploadFileMeta,
  ): Promise<MediaResult<UploadIntentDTO>>;
  confirmProfileMediaUpload(
    userId: string,
    assetId: string,
  ): Promise<MediaResult<MediaAssetDTO>>;
  getPublicMediaUrl(ref: MediaRefDTO): Promise<MediaResult<MediaAssetDTO>>;
  /**
   * Verify that `assetId` belongs to `userId`, has the expected `purpose` and is
   * `ready`, before another domain attaches it as a profile ref. Returns the
   * public-safe DTO. Never leaks `ownerId`/`storageKey` to non-owners.
   */
  verifyProfileAssetForAttach(
    userId: string,
    assetId: string,
    purpose: MediaPurpose,
  ): Promise<MediaResult<MediaAssetDTO>>;
}

type ServiceContext = {
  repo: MediaRepository;
  storage: MediaStoragePort;
  clock: MediaClock;
  idGen: MediaIdGenerator;
  publish: MediaEventPublisher;
};

function fail(code: MediaErrorCode, message: string, fields?: Record<string, string>): MediaError {
  return fields ? { code, message, fields } : { code, message };
}

function codeForFieldErrors(fields: Record<string, string>): MediaErrorCode {
  if (fields.mimeType) return "UNSUPPORTED_TYPE";
  if (fields.sizeBytes) return "TOO_LARGE";
  return "INVALID_INPUT";
}

function defaultIdGen(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `media_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function buildUploadIntent(
  ctx: ServiceContext,
  userId: string,
  purpose: MediaPurpose,
  meta: UploadFileMeta,
): Promise<MediaResult<UploadIntentDTO>> {
  if (!userId) return { ok: false, error: fail("FORBIDDEN", "Wymagane zalogowanie") };
  if (!canCreateUploadIntent("owner")) {
    return { ok: false, error: fail("FORBIDDEN", "Brak uprawnień") };
  }

  const errors = validateUploadFileMeta(purpose, meta);
  if (Object.keys(errors).length > 0) {
    const firstMessage = Object.values(errors)[0] ?? "Niepoprawny plik";
    return { ok: false, error: fail(codeForFieldErrors(errors), firstMessage, errors) };
  }

  const assetId = ctx.idGen();
  const storageKey = `user/${userId}/${purpose}/${assetId}`;
  const maxBytes = maxBytesFor(purpose);
  const target = await ctx.storage.createUploadTarget({
    storageKey,
    mimeType: meta.mimeType,
    maxBytes,
  });

  const now = ctx.clock();
  const record = await ctx.repo.create(
    {
      assetId,
      ownerId: userId,
      purpose,
      provider: target.provider,
      storageKey,
      publicUrl: target.publicUrl,
      mimeType: meta.mimeType,
      sizeBytes: meta.sizeBytes,
      width: meta.width ?? null,
      height: meta.height ?? null,
      status: "pending",
    },
    now,
  );

  ctx.publish({ type: "media.upload.intent_created", assetId, ownerId: userId, at: now });
  return { ok: true, value: toUploadIntentDTO(record, target, maxBytes) };
}

export function createMediaService(deps: MediaServiceDeps): MediaService {
  const ctx: ServiceContext = {
    repo: deps.repository,
    storage: deps.storage,
    clock: deps.clock ?? (() => new Date().toISOString()),
    idGen: deps.idGen ?? defaultIdGen,
    publish: deps.publish ?? (() => {}),
  };

  return {
    createAvatarUploadIntent: (userId, meta) =>
      buildUploadIntent(ctx, userId, "avatar", meta),

    createBannerUploadIntent: (userId, meta) =>
      buildUploadIntent(ctx, userId, "banner", meta),

    createStatusPhotoUploadIntent: (userId, meta) =>
      buildUploadIntent(ctx, userId, "statusPhoto", meta),

    async confirmProfileMediaUpload(userId, assetId) {
      const record = await ctx.repo.findById(assetId);
      if (!record) return { ok: false, error: fail("NOT_FOUND", "Zasób nie istnieje") };
      if (record.ownerId !== userId) {
        return { ok: false, error: fail("FORBIDDEN", "Brak uprawnień do zasobu") };
      }
      if (!record.publicUrl) {
        return {
          ok: false,
          error: fail(
            "STORAGE_UNAVAILABLE",
            "Przechowywanie plików nie jest jeszcze podłączone",
          ),
        };
      }
      const now = ctx.clock();
      const updated = await ctx.repo.update(assetId, { status: "ready" }, now);
      if (!updated) return { ok: false, error: fail("NOT_FOUND", "Zasób nie istnieje") };
      ctx.publish({ type: "media.upload.confirmed", assetId, ownerId: userId, at: now });
      return { ok: true, value: toMediaAssetDTO(updated) };
    },

    async getPublicMediaUrl(ref) {
      const record = await ctx.repo.findById(ref.assetId);
      if (!record) return { ok: false, error: fail("NOT_FOUND", "Zasób nie istnieje") };
      return { ok: true, value: toMediaAssetDTO(record) };
    },

    async verifyProfileAssetForAttach(userId, assetId, purpose) {
      if (!userId) {
        return { ok: false, error: fail("FORBIDDEN", "Wymagane zalogowanie") };
      }
      const record = await ctx.repo.findById(assetId);
      if (!record) return { ok: false, error: fail("NOT_FOUND", "Zasób nie istnieje") };
      if (record.ownerId !== userId) {
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
      return { ok: true, value: toMediaAssetDTO(record) };
    },
  };
}
