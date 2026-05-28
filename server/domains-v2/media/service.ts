/**
 * media — service (use-cases). Owns the first media runtime slice: avatar /
 * banner / status-photo upload intents, confirm, public URL read and
 * verifyProfileAssetForAttach. Storage SDK is injected; env-required port
 * honestly fails with STORAGE_UNAVAILABLE instead of faking success.
 *
 * Boundary types (PX-ID-001 / ADR-012): public service signatures use the
 * branded `UserId` / `MediaAssetId` types from `@shared/contracts/ids`. The
 * transport DTO surface in `./dto` keeps `string` for wire compatibility.
 */
import type {
  MediaError,
  MediaErrorCode,
  MediaResult,
  UploadFileMeta,
} from "./contracts";
import type {
  MediaAssetDTO,
  MediaPurpose,
  MediaRefDTO,
  OwnerUploadIntentDTO,
} from "./dto";
import type { MediaEvent } from "./events";
import { mediaUploadConfirmedEvent, mediaUploadIntentCreatedEvent } from "./events";
import { maxBytesFor, validateUploadFileMeta } from "./internal/validation";
import { toMediaAssetDTO, toOwnerUploadIntentDTO } from "./mapper";
import { canCreateUploadIntent } from "./policy";
import type { MediaRepository, MediaStoragePort } from "./repository";
import { createUuid } from "@shared/contracts/uuid";
import type { MediaAssetId, UserId } from "@shared/contracts/ids";

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
    ownerUserId: UserId,
    meta: UploadFileMeta,
  ): Promise<MediaResult<OwnerUploadIntentDTO>>;
  createBannerUploadIntent(
    ownerUserId: UserId,
    meta: UploadFileMeta,
  ): Promise<MediaResult<OwnerUploadIntentDTO>>;
  createStatusPhotoUploadIntent(
    ownerUserId: UserId,
    meta: UploadFileMeta,
  ): Promise<MediaResult<OwnerUploadIntentDTO>>;
  confirmProfileMediaUpload(
    ownerUserId: UserId,
    assetId: MediaAssetId,
  ): Promise<MediaResult<MediaAssetDTO>>;
  getPublicMediaUrl(ref: MediaRefDTO): Promise<MediaResult<MediaAssetDTO>>;
  /**
   * Verify that `assetId` belongs to `ownerUserId`, has the expected `purpose`
   * and is `ready`, before another domain attaches it as a profile ref.
   * Returns the public-safe DTO. Never leaks `ownerId`/`storageKey` to
   * non-owners.
   */
  verifyProfileAssetForAttach(
    ownerUserId: UserId,
    assetId: MediaAssetId,
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

/**
 * Default media asset id — UUID-formatted, aligned with the
 * `media_assets.id uuid` column type in supabase/migrations.
 * Tests inject deterministic UUID fixtures; production hits WebCrypto.
 */
function defaultIdGen(): string {
  return createUuid();
}

async function buildUploadIntent(
  ctx: ServiceContext,
  ownerUserId: UserId,
  purpose: MediaPurpose,
  meta: UploadFileMeta,
): Promise<MediaResult<OwnerUploadIntentDTO>> {
  if (!ownerUserId) return { ok: false, error: fail("FORBIDDEN", "Wymagane zalogowanie") };
  if (!canCreateUploadIntent("owner")) {
    return { ok: false, error: fail("FORBIDDEN", "Brak uprawnień") };
  }

  const errors = validateUploadFileMeta(purpose, meta);
  if (Object.keys(errors).length > 0) {
    const firstMessage = Object.values(errors)[0] ?? "Niepoprawny plik";
    return { ok: false, error: fail(codeForFieldErrors(errors), firstMessage, errors) };
  }

  const assetId = ctx.idGen();
  const storageKey = `user/${ownerUserId}/${purpose}/${assetId}`;
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
      ownerId: ownerUserId,
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

  ctx.publish(
    mediaUploadIntentCreatedEvent({
      assetId,
      ownerId: ownerUserId,
      purpose,
      occurredAt: now,
      generateId: ctx.idGen,
    }),
  );
  return { ok: true, value: toOwnerUploadIntentDTO(record, target, maxBytes) };
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
    createAvatarUploadIntent: (ownerUserId, meta) =>
      buildUploadIntent(ctx, ownerUserId, "avatar", meta),

    createBannerUploadIntent: (ownerUserId, meta) =>
      buildUploadIntent(ctx, ownerUserId, "banner", meta),

    createStatusPhotoUploadIntent: (ownerUserId, meta) =>
      buildUploadIntent(ctx, ownerUserId, "statusPhoto", meta),

    async confirmProfileMediaUpload(ownerUserId, assetId) {
      const record = await ctx.repo.findById(assetId);
      if (!record) return { ok: false, error: fail("NOT_FOUND", "Zasób nie istnieje") };
      if (record.ownerId !== ownerUserId) {
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
      ctx.publish(
        mediaUploadConfirmedEvent({
          assetId,
          ownerId: ownerUserId,
          purpose: updated.purpose,
          occurredAt: now,
          generateId: ctx.idGen,
        }),
      );
      return { ok: true, value: toMediaAssetDTO(updated) };
    },

    async getPublicMediaUrl(ref) {
      const record = await ctx.repo.findById(ref.assetId);
      if (!record) return { ok: false, error: fail("NOT_FOUND", "Zasób nie istnieje") };
      return { ok: true, value: toMediaAssetDTO(record) };
    },

    async verifyProfileAssetForAttach(ownerUserId, assetId, purpose) {
      if (!ownerUserId) {
        return { ok: false, error: fail("FORBIDDEN", "Wymagane zalogowanie") };
      }
      const record = await ctx.repo.findById(assetId);
      if (!record) return { ok: false, error: fail("NOT_FOUND", "Zasób nie istnieje") };
      if (record.ownerId !== ownerUserId) {
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
