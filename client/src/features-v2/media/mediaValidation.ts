/**
 * features-v2/media — local validation helpers.
 *
 * Mirrors the backend purpose-aware checks so the picker can show inline
 * feedback before calling the adapter. Authoritative validation still runs
 * on the backend; this is just to fail fast in the UI.
 */
import type {
  MediaPurpose,
  MediaPurposeDefinitionDTO,
  UploadFileMeta,
} from "@shared/contracts/media";
import { getMediaPurposeDefinition } from "@shared/contracts/media-purpose-registry";

export type LocalValidationError = {
  field: "mimeType" | "sizeBytes" | "maxFiles" | "sourceUri";
  message: string;
};

function MB(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function validateFileForPurpose(
  purpose: MediaPurpose,
  meta: UploadFileMeta,
): LocalValidationError | null {
  const def = getMediaPurposeDefinition(purpose);
  if (!def.allowedMimeTypes.includes(meta.mimeType)) {
    return { field: "mimeType", message: "Niedozwolony typ pliku dla tego medium" };
  }
  if (meta.mimeType.startsWith("video/")) {
    return {
      field: "mimeType",
      message: "Video tymczasowo wyłączone — wgraj obraz",
    };
  }
  if (!Number.isFinite(meta.sizeBytes) || meta.sizeBytes <= 0) {
    return { field: "sizeBytes", message: "Niepoprawny rozmiar pliku" };
  }
  if (meta.sizeBytes > def.maxSizeBytes) {
    return {
      field: "sizeBytes",
      message: `Plik jest za duży (maks. ${MB(def.maxSizeBytes)})`,
    };
  }
  if (meta.sourceUri && /^\s*data:/i.test(meta.sourceUri)) {
    return { field: "sourceUri", message: "Nieobsługiwane źródło pliku" };
  }
  return null;
}

export function validateFileCount(
  purpose: MediaPurpose,
  currentCount: number,
  newCount: number,
): LocalValidationError | null {
  const def = getMediaPurposeDefinition(purpose);
  if (currentCount + newCount > def.maxFiles) {
    return {
      field: "maxFiles",
      message: `Maksymalnie ${def.maxFiles} plik(ów) dla tego medium`,
    };
  }
  return null;
}

export function purposeAcceptAttr(def: MediaPurposeDefinitionDTO): string {
  return def.allowedMimeTypes.join(",");
}

export function metaFromFile(file: File): UploadFileMeta {
  return {
    mimeType: file.type,
    sizeBytes: file.size,
  };
}

export function generateIdempotencyKey(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `idem-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}
