/**
 * media — domain policies
 *
 * Who may create upload intents, confirm uploads and read assets. Free of
 * persistence concerns so it is unit-testable without a repository.
 *
 * Roles:
 *  - "owner"    — the authenticated user the asset belongs to
 *  - "stranger" — any non-owner viewer
 *  - "admin"    — placeholder, no runtime yet
 */
import type { MediaAssetStatus } from "./dto";

export type MediaViewerRole = "owner" | "stranger" | "admin";

/** Only the owner may request an upload destination for their profile media. */
export function canCreateUploadIntent(role: MediaViewerRole): boolean {
  return role === "owner";
}

/** Only the owner may confirm that bytes finished uploading. */
export function canConfirmUpload(role: MediaViewerRole): boolean {
  return role === "owner";
}

/**
 * Avatar/banner assets are profile-public once `ready`. While `pending`/`failed`
 * only the owner (or admin) may read them, so half-finished uploads never leak.
 */
export function canReadMediaAsset(
  role: MediaViewerRole,
  status: MediaAssetStatus,
): boolean {
  if (role === "owner" || role === "admin") return true;
  return status === "ready";
}
