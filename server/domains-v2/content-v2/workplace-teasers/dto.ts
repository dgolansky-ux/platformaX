// === Slice 25 PRE-runtime ACK markers (EXC-016) =====================
// PX-CTX-001-ACK: pre-runtime content/feed DTO; explicit owner/ref context fields scheduled with content read-model slice. EXC-016.
// === end Slice 25 ACK markers =======================================

/**
 * content-v2/workplace-teasers — DTOs (Slice 12 / BACKEND_PARTIAL).
 *
 * A "teaser" is a small read-model item that surfaces on the FRIEND FEED when
 * a workplace post is published. It is NOT a full friend feed post:
 *
 *   - it carries only a short preview (≤ WORKPLACE_POST_TEASER_PREVIEW_MAX),
 *   - it does NOT carry contact data,
 *   - it visually renders smaller than a post card,
 *   - clicking it navigates to the FULL workplace post on the workplace page.
 *
 * Dedupe: at most one teaser per source workplace post id (`dedupeKey`).
 *
 * Privacy: Public DTO carries only ids + the (truncated)
 * preview text + an optional media ref + the workplace summary fields needed
 * to render the card. No PII.
 */

export type WorkplaceTeaserVisibility = "friends_only" | "public";

export interface WorkplaceTeaserRecord {
  id: string;
  sourceType: "workplace_post";
  sourcePostId: string;
  workplaceId: string;
  ownerUserId: string;
  previewText: string;
  previewMediaRef: string | null;
  workplaceName: string;
  workplaceSlug: string;
  visibility: WorkplaceTeaserVisibility;
  dedupeKey: string;
  createdAt: string;
}

export interface WorkplaceTeaserPublicDTO {
  id: string;
  sourceType: "workplace_post";
  sourcePostId: string;
  workplaceId: string;
  workplaceName: string;
  workplaceSlug: string;
  ownerUserId: string;
  previewText: string;
  previewMediaRef: string | null;
  visibility: WorkplaceTeaserVisibility;
  createdAt: string;
  /** Logical target route the UI should navigate to on click. */
  targetRoute: string;
}

export interface CreateWorkplaceTeaserCommand {
  sourcePostId: string;
  workplaceId: string;
  ownerUserId: string;
  workplaceName: string;
  workplaceSlug: string;
  postBody: string;
  postMediaRefs: readonly string[];
  postVisibility: "workplace_public" | "friends_only" | "private";
}

export interface ListWorkplaceTeasersForViewerQuery {
  viewerUserId: string;
  cursor?: string | null;
  limit?: number;
}

export const WORKPLACE_TEASER_DEFAULT_LIMIT = 20;
export const WORKPLACE_TEASER_MAX_LIMIT = 50;
