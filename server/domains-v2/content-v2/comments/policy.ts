/**
 * content-v2 / comments — pure content-level validation. NO role/membership
 * checks (those belong to communities-v2 via application-v2). Body rules and
 * author-only edit/delete only.
 */
export const COMMENT_BODY_MAX = 2000;

export function isNonEmptyBody(body: string): boolean {
  return body.trim().length > 0;
}

export function isWithinLength(body: string): boolean {
  return body.length <= COMMENT_BODY_MAX;
}

export function isAuthor(authorUserId: string, actorUserId: string): boolean {
  return authorUserId === actorUserId;
}
