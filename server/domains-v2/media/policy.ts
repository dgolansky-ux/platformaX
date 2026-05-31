/**
 * media — domain policies
 *
 * Who may create upload intents, confirm uploads, read assets and request a
 * delete. Free of persistence concerns so it is unit-testable without a
 * repository.
 *
 * Visibility-aware reads use the purpose-registry default (or the record's
 * own visibility) plus the viewer's relationship to the owner. The media
 * domain DOES NOT decide friendship/membership — it consumes a boolean the
 * application layer (which orchestrates the social/community domains) computed.
 *
 * Roles:
 *  - "owner"    — the authenticated user the asset belongs to (or the
 *                 community/channel/workplace admin acting on its behalf)
 *  - "stranger" — any non-owner viewer
 *  - "admin"    — placeholder, no runtime yet
 */
import type { MediaAssetStatus, MediaVisibility } from "@shared/contracts/media";

export type MediaViewerRole = "owner" | "stranger" | "admin";

export type MediaReadContext = {
  role: MediaViewerRole;
  status: MediaAssetStatus;
  visibility: MediaVisibility;
  /** Whether the viewer is a friend of the owner (social-domain decision). */
  viewerIsFriend?: boolean;
  /** Whether the viewer is a member of the owning community/channel. */
  viewerIsMember?: boolean;
};

/** Only the owner may request an upload destination. */
export function canCreateUploadIntent(role: MediaViewerRole): boolean {
  return role === "owner";
}

/** Only the owner may confirm that bytes finished uploading. */
export function canConfirmUpload(role: MediaViewerRole): boolean {
  return role === "owner";
}

/** Only the owner may soft-delete an asset. */
export function canDeleteMediaAsset(role: MediaViewerRole): boolean {
  return role === "owner";
}

/**
 * Visibility-aware read policy. While `pending`/`processing`/`failed` only the
 * owner (or admin) may read the asset, so half-finished uploads never leak.
 * Once `ready`, the visibility tier decides who can see the URL.
 */
export function canReadMediaAsset(ctx: MediaReadContext): boolean {
  if (ctx.role === "owner" || ctx.role === "admin") return true;
  if (ctx.status !== "ready") return false;
  switch (ctx.visibility) {
    case "public":
      return true;
    case "friends_only":
      return Boolean(ctx.viewerIsFriend);
    case "members_only":
      return Boolean(ctx.viewerIsMember);
    case "owner_only":
      return false;
  }
}
