/**
 * features-v2/media — runtime adapter
 *
 * Status: `MOCK_LOCAL_ONLY` / `BACKEND_NOT_STARTED` / `STORAGE_ADAPTER_ENV_REQUIRED`.
 *
 * The client UI depends on a single `MediaUploadAdapter` contract
 * (`@shared/contracts/media`). This file ships a **mock** implementation that
 * validates upload metadata locally and tracks created intents in a
 * module-scoped `Map`, so the UI can run end-to-end without an HTTP transport
 * and without any `@server/*` runtime import. Storage is reported as
 * disconnected, so `confirmProfileMediaUpload` honestly fails with
 * `STORAGE_UNAVAILABLE` instead of pretending bytes were stored.
 *
 * When a real HTTP/RPC transport is wired, replace this file with an HTTP
 * client adapter implementing the same contract — UI screens do not change.
 */
import type {
  ConfirmUploadResult,
  CreateUploadIntentResult,
  GetMediaUrlResult,
  MediaAssetDTO,
  MediaError,
  MediaErrorCode,
  MediaPurpose,
  MediaRefDTO,
  MediaUploadAdapter,
  UploadFileMeta,
  UploadIntentDTO,
} from "@shared/contracts/media";

const MB = 1024 * 1024;
const MAX_BYTES: Record<MediaPurpose, number> = {
  avatar: 5 * MB,
  banner: 10 * MB,
  statusPhoto: 5 * MB,
};
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function isAllowedMime(mime: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

function fail(
  code: MediaErrorCode,
  message: string,
  fields?: Record<string, string>,
): MediaError {
  return fields ? { code, message, fields } : { code, message };
}

function codeForFieldErrors(fields: Record<string, string>): MediaErrorCode {
  if (fields.mimeType) return "UNSUPPORTED_TYPE";
  if (fields.sizeBytes) return "TOO_LARGE";
  return "INVALID_INPUT";
}

function validateUploadFileMeta(
  purpose: MediaPurpose,
  meta: UploadFileMeta,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!meta || typeof meta.mimeType !== "string" || meta.mimeType.length === 0) {
    errors.mimeType = "Brak typu pliku";
  } else if (!isAllowedMime(meta.mimeType)) {
    errors.mimeType = "Dozwolone formaty: JPG, PNG, WEBP";
  }

  const size = Number(meta?.sizeBytes);
  if (!Number.isFinite(size) || size <= 0) {
    errors.sizeBytes = "Niepoprawny rozmiar pliku";
  } else if (size > MAX_BYTES[purpose]) {
    const limitMb = Math.round(MAX_BYTES[purpose] / MB);
    errors.sizeBytes = `Plik jest za duży (maks. ${limitMb} MB)`;
  }

  const uri = meta?.sourceUri;
  if (uri && /^\s*data:/i.test(uri)) {
    errors.sourceUri = "Nieobsługiwane źródło pliku";
  }

  return errors;
}

function nextAssetId(counter: { value: number }): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  counter.value += 1;
  return `mock-asset-${counter.value}`;
}

/**
 * Build a fresh mock adapter with its own in-memory intent store. Useful in
 * tests so each case starts from a clean slate. The default `mediaAdapter`
 * exported below uses a single module-scoped store shared across the session.
 */
export function createMockMediaAdapter(): MediaUploadAdapter {
  const intents = new Map<string, UploadIntentDTO>();
  const counter = { value: 0 };

  async function buildIntent(
    userId: string,
    purpose: MediaPurpose,
    meta: UploadFileMeta,
  ): Promise<CreateUploadIntentResult> {
    if (!userId) return { ok: false, error: fail("FORBIDDEN", "Wymagane zalogowanie") };
    const errors = validateUploadFileMeta(purpose, meta);
    if (Object.keys(errors).length > 0) {
      const firstMessage = Object.values(errors)[0] ?? "Niepoprawny plik";
      return { ok: false, error: fail(codeForFieldErrors(errors), firstMessage, errors) };
    }
    const assetId = nextAssetId(counter);
    const intent: UploadIntentDTO = {
      assetId,
      purpose,
      uploadUrl: null,
      method: "PUT",
      storageKey: `user/${userId}/${purpose}/${assetId}`,
      maxBytes: MAX_BYTES[purpose],
      mimeType: meta.mimeType,
      transport: "ENV_REQUIRED",
      expiresAt: null,
    };
    intents.set(assetId, intent);
    return { ok: true, value: intent };
  }

  return {
    isStorageConnected: () => false,

    createAvatarUploadIntent: (userId, meta) => buildIntent(userId, "avatar", meta),
    createBannerUploadIntent: (userId, meta) => buildIntent(userId, "banner", meta),
    createStatusPhotoUploadIntent: (userId, meta) => buildIntent(userId, "statusPhoto", meta),

    async confirmProfileMediaUpload(_userId, _assetId): Promise<ConfirmUploadResult> {
      return {
        ok: false,
        error: fail(
          "STORAGE_UNAVAILABLE",
          "Przechowywanie plików nie jest jeszcze podłączone",
        ),
      };
    },

    async getPublicMediaUrl(ref: MediaRefDTO): Promise<GetMediaUrlResult> {
      const intent = intents.get(ref.assetId);
      if (!intent) {
        return { ok: false, error: fail("NOT_FOUND", "Zasób nie istnieje") };
      }
      const asset: MediaAssetDTO = {
        assetId: intent.assetId,
        purpose: intent.purpose,
        status: "pending",
        url: null,
        mimeType: intent.mimeType,
        width: null,
        height: null,
      };
      return { ok: true, value: asset };
    },
  };
}

/** Default session-scoped mock media adapter. */
export const mediaAdapter: MediaUploadAdapter = createMockMediaAdapter();
