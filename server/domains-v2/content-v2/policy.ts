/**
 * content-v2 — pure visibility policy. Friendship is supplied by the caller
 * (application use-case via social public-api) — content never imports social.
 */
import type { PostRecord } from "./ports";

const PREVIEW_MAX = 280;

/**
 * Can `viewerUserId` see this post? public → everyone; friends → owner or a
 * confirmed friend; private → owner only. `isFriend` is passed in by the
 * orchestrating use-case (content has no knowledge of the social graph).
 */
export function canSeePost(
  post: Pick<PostRecord, "authorUserId" | "visibility" | "status">,
  viewerUserId: string,
  isFriend: boolean,
): boolean {
  if (post.status !== "active") return false;
  if (post.authorUserId === viewerUserId) return true;
  if (post.visibility === "public") return true;
  if (post.visibility === "friends") return isFriend;
  return false;
}

export function bodyPreview(body: string): string {
  return body.length <= PREVIEW_MAX ? body : `${body.slice(0, PREVIEW_MAX)}…`;
}
