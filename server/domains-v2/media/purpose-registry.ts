/**
 * media — purpose registry (server-side helpers).
 *
 * The authoritative table of definitions lives in
 * `@shared/contracts/media-purpose-registry` so both server and client agree
 * on the same limits without duplication. This file adds the server-only
 * helpers (storage path, typed predicate) and re-exports the lookup.
 */
import type {
  MediaOwnerType,
  MediaPurpose,
  MediaPurposeDefinitionDTO,
} from "@shared/contracts/media";
import {
  getMediaPurposeDefinition,
  listMediaPurposeDefinitions,
  MEDIA_PURPOSE_LIST,
} from "@shared/contracts/media-purpose-registry";

/** Storage path is always `{ownerType}/{ownerId}/{purpose}/{assetId}`. */
export const STORAGE_PATH_PATTERN = "{ownerType}/{ownerId}/{purpose}/{assetId}" as const;

export function isMediaPurpose(value: string): value is MediaPurpose {
  return (MEDIA_PURPOSE_LIST as readonly string[]).includes(value);
}

export function getPurposeDefinition(purpose: MediaPurpose): MediaPurposeDefinitionDTO {
  return getMediaPurposeDefinition(purpose);
}

export function listPurposeDefinitions(): readonly MediaPurposeDefinitionDTO[] {
  return listMediaPurposeDefinitions();
}

export function buildStoragePath(
  ownerType: MediaOwnerType,
  ownerId: string,
  purpose: MediaPurpose,
  assetId: string,
): string {
  return `${ownerType}/${ownerId}/${purpose}/${assetId}`;
}
