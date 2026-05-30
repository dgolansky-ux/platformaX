/**
 * content-v2/friend-posts — pure visibility + validation policy. No IO.
 */
import {
  FRIEND_POST_BODY_MAX,
  FRIEND_POST_COMMENT_BODY_MAX,
  FRIEND_POST_MEDIA_REFS_MAX,
  type FriendPostVisibility,
} from "./dto";

export type FriendPostValidationError =
  | "BODY_REQUIRED"
  | "BODY_TOO_LONG"
  | "VISIBILITY_INVALID"
  | "MEDIA_REFS_TOO_MANY"
  | "MEDIA_REF_INVALID";

const VISIBILITIES: readonly FriendPostVisibility[] = ["friends_only", "private", "public"];

export function isFriendPostVisibility(v: string): v is FriendPostVisibility {
  return (VISIBILITIES as readonly string[]).includes(v);
}

export function validateFriendPostBody(body: string): FriendPostValidationError | null {
  const trimmed = body.trim();
  if (trimmed.length === 0) return "BODY_REQUIRED";
  if (trimmed.length > FRIEND_POST_BODY_MAX) return "BODY_TOO_LONG";
  return null;
}

export function validateFriendPostMediaRefs(refs: readonly string[] | undefined): FriendPostValidationError | null {
  if (!refs) return null;
  if (refs.length > FRIEND_POST_MEDIA_REFS_MAX) return "MEDIA_REFS_TOO_MANY";
  for (const r of refs) {
    if (typeof r !== "string" || r.trim().length === 0) return "MEDIA_REF_INVALID";
    if (r.startsWith("data:")) return "MEDIA_REF_INVALID";
  }
  return null;
}

export function validateFriendPostCommentBody(body: string): FriendPostValidationError | null {
  const trimmed = body.trim();
  if (trimmed.length === 0) return "BODY_REQUIRED";
  if (trimmed.length > FRIEND_POST_COMMENT_BODY_MAX) return "BODY_TOO_LONG";
  return null;
}

/**
 * Can `viewerUserId` see the friend post given its visibility + the friendship
 * verdict supplied by the application layer? Author always sees own.
 */
export function canViewFriendPost(
  post: { authorUserId: string; visibility: FriendPostVisibility; status: string },
  viewerUserId: string,
  isFriend: boolean,
): boolean {
  if (post.status === "deactivated" || post.status === "draft") {
    return post.authorUserId === viewerUserId;
  }
  if (post.authorUserId === viewerUserId) return true;
  if (post.visibility === "public") return true;
  if (post.visibility === "friends_only") return isFriend;
  return false; // private
}
