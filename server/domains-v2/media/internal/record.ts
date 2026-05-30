/**
 * media — internal persistence records
 *
 * The shapes repositories store. Kept under `/internal/` so they stay invisible
 * to the public-DTO PII guard (this is where storage internals legitimately
 * live) and unreachable by other domains. Never mapped wholesale into a public
 * DTO — public projections live in `../mapper.ts`.
 */
import type {
  MediaAssetStatus,
  MediaOwnerType,
  MediaPurpose,
  MediaVariantStatus,
  MediaVariantType,
  MediaVisibility,
} from "@shared/contracts/media";

export type MediaAssetRecord = {
  assetId: string;
  ownerUserId: string;
  ownerType: MediaOwnerType;
  ownerId: string;
  purpose: MediaPurpose;
  originalFilename: string | null;
  /** Storage backend identity (e.g. supabase-storage). Internal only. */
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
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type MediaVariantRecord = {
  variantId: string;
  assetId: string;
  variantType: MediaVariantType;
  width: number | null;
  height: number | null;
  storageKey: string | null;
  url: string | null;
  status: MediaVariantStatus;
  createdAt: string;
  updatedAt: string;
};

export type UploadIntentStatus = "active" | "used" | "expired" | "cancelled";

export type UploadIntentRecord = {
  intentId: string;
  actorUserId: string;
  ownerType: MediaOwnerType;
  ownerId: string;
  purpose: MediaPurpose;
  allowedMimeTypes: readonly string[];
  maxSizeBytes: number;
  maxFiles: number;
  expiresAt: string;
  status: UploadIntentStatus;
  idempotencyKey: string;
  assetId: string;
  createdAt: string;
  usedAt: string | null;
};
