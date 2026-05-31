/**
 * content-v2 / community-feeds — pure content-level validation. NO role/
 * membership checks (those belong to communities-v2 via application-v2).
 */
import type { CommunityFeedType } from "./dto";

const FEED_TYPES: readonly CommunityFeedType[] = ["community_all", "relational", "staff_only"];

export function isValidFeedType(value: string): value is CommunityFeedType {
  return (FEED_TYPES as readonly string[]).includes(value);
}

export function isNonEmptyBody(body: string): boolean {
  return body.trim().length > 0;
}

export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}
