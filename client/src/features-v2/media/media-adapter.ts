/**
 * features-v2/media — runtime adapter (mock).
 *
 * QUALITY_STRUCTURE_EXCEPTION: Slice 18 keeps the mock implementation
 * (createMockMediaAdapter) as one function-scoped object literal returning
 * every adapter method, so the in-memory `Map` state is shared by every
 * method without leaking through closures. Splitting per-method would force
 * those Maps to be pulled out to module scope (breaking
 * `createMockMediaAdapter`'s "fresh adapter per call" semantics tests rely
 * on). Tracked as EXC-009 in docs/governance/EXCEPTIONS_REGISTER.md.
 *
 * Status: `MOCK_LOCAL_ONLY` / `BACKEND_NOT_STARTED` / `STORAGE_ADAPTER_ENV_REQUIRED`.
 *
 * The client UI depends on a single `MediaUploadAdapter` contract
 * (`@shared/contracts/media`). This file ships a **mock** implementation that
 * validates upload metadata locally, tracks created intents in a module-scoped
 * `Map` and completes/lists assets in-memory, so the UI can run end-to-end
 * without an HTTP transport and without any `@server/*` runtime import. Storage
 * is reported as disconnected, so `completeUpload` honestly fails with
 * `STORAGE_UNAVAILABLE` instead of pretending bytes were stored.
 *
 * When a real HTTP/RPC transport is wired, replace this file with an HTTP
 * client adapter implementing the same contract — UI screens do not change.
 */
import type {
  CompleteUploadInput,
  ConfirmUploadResult,
  CreateUploadIntentInput,
  CreateUploadIntentResult,
  GetMediaUrlResult,
  ListOwnerAssetsResult,
  MediaAssetDTO,
  MediaError,
  MediaErrorCode,
  MediaOwnerRefDTO,
  MediaPurpose,
  MediaPurposeDefinitionDTO,
  MediaRefDTO,
  MediaUploadAdapter,
  UploadIntentDTO,
} from "@shared/contracts/media";
import {
  getMediaPurposeDefinition,
  MEDIA_PURPOSE_LIST,
} from "@shared/contracts/media-purpose-registry";

function fail(
  code: MediaErrorCode,
  message: string,
  fields?: Record<string, string>,
): MediaError {
  return fields ? { code, message, fields } : { code, message };
}

function codeForFieldErrors(fields: Record<string, string>): MediaErrorCode {
  if (fields.purpose) return "INVALID_PURPOSE";
  if (fields.ownerType) return "INVALID_OWNER_TYPE";
  if (fields.mimeType) return "UNSUPPORTED_TYPE";
  if (fields.sizeBytes) return "TOO_LARGE";
  return "INVALID_INPUT";
}

function isVideoMime(mime: string): boolean {
  return mime.startsWith("video/");
}

function isInlineRef(uri: string | null | undefined): boolean {
  if (!uri) return false;
  return /^\s*data:/i.test(uri);
}

function MB(value: number): string {
  return `${Math.round(value / (1024 * 1024))} MB`;
}

function validateInput(input: CreateUploadIntentInput): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!(MEDIA_PURPOSE_LIST as readonly string[]).includes(input.purpose)) {
    errors.purpose = "Nieznany typ medium";
    return errors;
  }

  const def = getMediaPurposeDefinition(input.purpose);
  if (!def.allowedOwnerTypes.includes(input.ownerRef.ownerType)) {
    errors.ownerType = "Ten typ właściciela nie pasuje do tego medium";
  }

  const meta = input.fileMeta;
  if (!meta || typeof meta.mimeType !== "string" || meta.mimeType.length === 0) {
    errors.mimeType = "Brak typu pliku";
  } else if (!def.allowedMimeTypes.includes(meta.mimeType)) {
    errors.mimeType = "Niedozwolony typ pliku dla tego medium";
  } else if (isVideoMime(meta.mimeType)) {
    errors.mimeType = "Video tymczasowo wyłączone — wgraj obraz";
  }

  const size = Number(meta?.sizeBytes);
  if (!Number.isFinite(size) || size <= 0) {
    errors.sizeBytes = "Niepoprawny rozmiar pliku";
  } else if (size > def.maxSizeBytes) {
    errors.sizeBytes = `Plik jest za duży (maks. ${MB(def.maxSizeBytes)})`;
  }

  if (isInlineRef(meta?.sourceUri)) {
    errors.sourceUri = "Nieobsługiwane źródło pliku";
  }

  if (!input.idempotencyKey || input.idempotencyKey.trim().length === 0) {
    errors.idempotencyKey = "Brak idempotencyKey";
  }

  return errors;
}

function nextId(counter: { value: number }, label: string): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  counter.value += 1;
  return `${label}-${counter.value}`;
}

type StoredAsset = {
  asset: MediaAssetDTO;
  ownerRef: MediaOwnerRefDTO;
  ownerUserId: string;
};

/**
 * Build a fresh mock adapter with its own in-memory intent store. Useful in
 * tests so each case starts from a clean slate. The default `mediaAdapter`
 * exported below uses a single module-scoped store shared across the session.
 */
export function createMockMediaAdapter(): MediaUploadAdapter {
  const intents = new Map<string, UploadIntentDTO>();
  const intentsByKey = new Map<string, string>();
  const assets = new Map<string, StoredAsset>();
  const counter = { value: 0 };

  function idempotencyKey(actorUserId: string, key: string): string {
    return `${actorUserId}::${key}`;
  }

  return {
    isStorageConnected: () => false,

    getPurposeDefinition: (purpose: MediaPurpose): MediaPurposeDefinitionDTO =>
      getMediaPurposeDefinition(purpose),

    async createUploadIntent(input: CreateUploadIntentInput): Promise<CreateUploadIntentResult> {
      if (!input.actorUserId) {
        return { ok: false, error: fail("FORBIDDEN", "Wymagane zalogowanie") };
      }

      const errors = validateInput(input);
      if (Object.keys(errors).length > 0) {
        const firstMessage = Object.values(errors)[0] ?? "Niepoprawny plik";
        return { ok: false, error: fail(codeForFieldErrors(errors), firstMessage, errors) };
      }

      const idemComposite = idempotencyKey(input.actorUserId, input.idempotencyKey);
      const replayIntentId = intentsByKey.get(idemComposite);
      if (replayIntentId) {
        const existing = intents.get(replayIntentId);
        if (existing) return { ok: true, value: existing };
      }

      const def = getMediaPurposeDefinition(input.purpose);
      const assetId = nextId(counter, "mock-asset");
      const intentId = nextId(counter, "mock-intent");
      const storageKey = `${input.ownerRef.ownerType}/${input.ownerRef.ownerId}/${input.purpose}/${assetId}`;
      const intent: UploadIntentDTO = {
        intentId,
        assetId,
        purpose: input.purpose,
        ownerType: input.ownerRef.ownerType,
        ownerId: input.ownerRef.ownerId,
        uploadUrl: null,
        method: "PUT",
        storageKey,
        maxBytes: def.maxSizeBytes,
        maxFiles: def.maxFiles,
        allowedMimeTypes: def.allowedMimeTypes,
        mimeType: input.fileMeta.mimeType,
        transport: "ENV_REQUIRED",
        expiresAt: null,
      };
      intents.set(intentId, intent);
      intentsByKey.set(idemComposite, intentId);

      // Track a pending asset so `getPublicMediaUrl` can answer (with `null` url).
      assets.set(assetId, {
        asset: {
          assetId,
          purpose: input.purpose,
          ownerType: input.ownerRef.ownerType,
          status: "upload_intent_created",
          visibility: def.defaultVisibility,
          url: null,
          mimeType: input.fileMeta.mimeType,
          width: input.fileMeta.width ?? null,
          height: input.fileMeta.height ?? null,
          durationSeconds: null,
          variants: [],
        },
        ownerRef: input.ownerRef,
        ownerUserId: input.actorUserId,
      });

      return { ok: true, value: intent };
    },

    async completeUpload(input: CompleteUploadInput): Promise<ConfirmUploadResult> {
      if (!input.actorUserId) {
        return { ok: false, error: fail("FORBIDDEN", "Wymagane zalogowanie") };
      }
      const intent = intents.get(input.intentId);
      if (!intent) {
        return { ok: false, error: fail("NOT_FOUND", "Brak intencji uploadu") };
      }
      if (intent.assetId !== input.assetId) {
        return { ok: false, error: fail("INVALID_INPUT", "Niezgodny zasób") };
      }
      // Storage isn't connected — honest failure.
      return {
        ok: false,
        error: fail(
          "STORAGE_UNAVAILABLE",
          "Przechowywanie plików nie jest jeszcze podłączone",
        ),
      };
    },

    async getPublicMediaUrl(ref: MediaRefDTO): Promise<GetMediaUrlResult> {
      const stored = assets.get(ref.assetId);
      if (!stored) {
        return { ok: false, error: fail("NOT_FOUND", "Zasób nie istnieje") };
      }
      return { ok: true, value: stored.asset };
    },

    async listAssetsForOwner(ownerRef: MediaOwnerRefDTO): Promise<ListOwnerAssetsResult> {
      const out: MediaAssetDTO[] = [];
      for (const stored of assets.values()) {
        if (
          stored.ownerRef.ownerType === ownerRef.ownerType &&
          stored.ownerRef.ownerId === ownerRef.ownerId
        ) {
          out.push(stored.asset);
        }
      }
      return { ok: true, value: out };
    },
  };
}

/** Default session-scoped mock media adapter. */
export const mediaAdapter: MediaUploadAdapter = createMockMediaAdapter();
