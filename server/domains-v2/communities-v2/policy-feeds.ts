/**
 * communities-v2 — pure feed policy (Slice 5). No I/O. Decides who may post to /
 * view each feed and who may publish down the structure. `feedType` is taken as
 * a string literal so communities-v2 stays decoupled from content-v2's enum.
 */
import type { CommunityRole } from "./dto";
import type { CommunityFeedSettingsDTO, DescendantPublishRole } from "./dto-feeds";

export const RELATIONAL_LIMIT_MIN = 1;
export const RELATIONAL_LIMIT_MAX = 10;

const DESCENDANT_ROLES: readonly DescendantPublishRole[] = ["founder", "admin", "moderator"];

export function isValidRelationalLimit(n: number): boolean {
  return Number.isInteger(n) && n >= RELATIONAL_LIMIT_MIN && n <= RELATIONAL_LIMIT_MAX;
}

export function isValidPostingPolicy(value: string): value is "all_members" | "staff_only" {
  return value === "all_members" || value === "staff_only";
}

export function isValidDescendantRole(value: string): value is DescendantPublishRole {
  return (DESCENDANT_ROLES as readonly string[]).includes(value);
}

export function isStaffRole(role: CommunityRole | null): boolean {
  return role === "founder" || role === "admin" || role === "moderator";
}

/** Only founder/admin may change feed settings. */
export function canUpdateFeedSettings(role: CommunityRole | null): boolean {
  return role === "founder" || role === "admin";
}

export function canPostToCommunityAll(role: CommunityRole | null, settings: CommunityFeedSettingsDTO): boolean {
  if (!settings.communityAllEnabled || role === null) return false;
  return settings.communityAllPostingPolicy === "all_members" ? true : isStaffRole(role);
}

export function canPostRelational(role: CommunityRole | null, settings: CommunityFeedSettingsDTO): boolean {
  return settings.relationalEnabled && role !== null;
}

export function canPostStaffOnly(role: CommunityRole | null, settings: CommunityFeedSettingsDTO): boolean {
  return settings.staffOnlyEnabled && isStaffRole(role);
}

/** community_all is members-only by default (no stranger preview in Slice 5). */
export function canViewCommunityAll(role: CommunityRole | null, settings: CommunityFeedSettingsDTO): boolean {
  return settings.communityAllEnabled && role !== null;
}

export function canViewRelational(role: CommunityRole | null, settings: CommunityFeedSettingsDTO): boolean {
  return settings.relationalEnabled && role !== null;
}

export function canViewStaffOnly(role: CommunityRole | null, settings: CommunityFeedSettingsDTO): boolean {
  return settings.staffOnlyEnabled && isStaffRole(role);
}

/**
 * May the actor publish this feed type DOWN into descendant communities?
 * Only community_all + staff_only are propagatable (never relational), the
 * feature must be enabled, and the actor's role must be allowed.
 */
export function canPublishToDescendants(
  role: CommunityRole | null,
  settings: CommunityFeedSettingsDTO,
  feedType: string,
): boolean {
  if (feedType !== "community_all" && feedType !== "staff_only") return false;
  if (!settings.descendantPublishingEnabled || role === null) return false;
  return (settings.descendantPublishingAllowedRoles as readonly string[]).includes(role);
}
