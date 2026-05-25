/**
 * media — internal persistence record
 *
 * The shape repositories store. Kept under /internal/ so it stays invisible to
 * the public-DTO PII guard (this is where storage internals legitimately live)
 * and unreachable by other domains. Never mapped wholesale into a public DTO.
 */
import type { MediaAssetStatus, MediaPurpose } from "../dto";

export type MediaAssetRecord = {
  assetId: string;
  ownerType: "user";
  ownerId: string;
  purpose: MediaPurpose;
  /** Storage backend identity (e.g. supabase-storage). Internal only. */
  provider: string;
  storageKey: string;
  publicUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  status: MediaAssetStatus;
  createdAt: string;
  updatedAt: string;
};
