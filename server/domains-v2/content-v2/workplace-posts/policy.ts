/**
 * content-v2/workplace-posts — pure policy + validation. No IO.
 */
import {
  WORKPLACE_POST_BODY_MAX,
  WORKPLACE_POST_MEDIA_REFS_MAX,
  type WorkplacePostRecord,
  type WorkplacePostType,
  type WorkplacePostVisibility,
} from "./dto";

export type WorkplacePostValidationError =
  | "BODY_REQUIRED"
  | "BODY_TOO_LONG"
  | "MEDIA_REFS_TOO_MANY"
  | "MEDIA_REF_INVALID"
  | "POST_TYPE_INVALID"
  | "VISIBILITY_INVALID";

const POST_TYPES: readonly WorkplacePostType[] = [
  "update",
  "realization",
  "offer",
  "photo_note",
  "announcement",
];

const VISIBILITIES: readonly WorkplacePostVisibility[] = [
  "workplace_public",
  "friends_only",
  "private",
];

export function isWorkplacePostType(v: string): v is WorkplacePostType {
  return (POST_TYPES as readonly string[]).includes(v);
}

export function isWorkplacePostVisibility(v: string): v is WorkplacePostVisibility {
  return (VISIBILITIES as readonly string[]).includes(v);
}

export function validateWorkplacePostBody(body: string): WorkplacePostValidationError | null {
  const trimmed = body.trim();
  if (trimmed.length === 0) return "BODY_REQUIRED";
  if (trimmed.length > WORKPLACE_POST_BODY_MAX) return "BODY_TOO_LONG";
  return null;
}

export function validateWorkplacePostMediaRefs(
  refs: readonly string[] | undefined,
): WorkplacePostValidationError | null {
  if (!refs) return null;
  if (refs.length > WORKPLACE_POST_MEDIA_REFS_MAX) return "MEDIA_REFS_TOO_MANY";
  for (const r of refs) {
    if (typeof r !== "string" || r.trim().length === 0) return "MEDIA_REF_INVALID";
    if (r.startsWith("data:")) return "MEDIA_REF_INVALID";
  }
  return null;
}

export function canViewWorkplacePost(
  post: Pick<WorkplacePostRecord, "authorUserId" | "visibility" | "status">,
  ownerUserId: string,
  viewerUserId: string,
  isFriendOfOwner: boolean,
): boolean {
  if (post.status === "deactivated" || post.status === "draft") {
    return post.authorUserId === viewerUserId;
  }
  if (post.authorUserId === viewerUserId) return true;
  if (viewerUserId === ownerUserId) return true;
  if (post.visibility === "workplace_public") return true;
  if (post.visibility === "friends_only") return isFriendOfOwner;
  return false;
}
