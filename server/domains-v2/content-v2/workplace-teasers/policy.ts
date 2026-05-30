/**
 * content-v2/workplace-teasers — pure policy. No IO.
 *
 * The teaser is intentionally a smaller projection than the full post —
 * `buildPreviewText` truncates and never returns the full body when the body
 * exceeds the preview cap.
 */
import { WORKPLACE_POST_TEASER_PREVIEW_MAX } from "../workplace-posts/dto";
import type {
  WorkplaceTeaserRecord,
  WorkplaceTeaserVisibility,
} from "./dto";

export function isWorkplaceTeaserVisibility(v: string): v is WorkplaceTeaserVisibility {
  return v === "friends_only" || v === "public";
}

export function buildPreviewText(body: string): string {
  const trimmed = body.trim().replace(/\s+/g, " ");
  if (trimmed.length <= WORKPLACE_POST_TEASER_PREVIEW_MAX) return trimmed;
  return `${trimmed.slice(0, WORKPLACE_POST_TEASER_PREVIEW_MAX - 1).trimEnd()}…`;
}

export function deriveTeaserVisibility(
  postVisibility: "workplace_public" | "friends_only" | "private",
): WorkplaceTeaserVisibility | null {
  if (postVisibility === "private") return null;
  if (postVisibility === "workplace_public") return "public";
  return "friends_only";
}

export function canViewTeaser(
  teaser: Pick<WorkplaceTeaserRecord, "ownerUserId" | "visibility">,
  viewerUserId: string,
  isFriendOfOwner: boolean,
): boolean {
  if (teaser.ownerUserId === viewerUserId) return true;
  if (teaser.visibility === "public") return true;
  return isFriendOfOwner;
}

export function buildDedupeKey(sourcePostId: string): string {
  return `workplace_post:${sourcePostId}`;
}
