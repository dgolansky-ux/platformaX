/**
 * identity — domain policies
 *
 * Decides who may read/write which projection of a profile. Stays free of
 * persistence concerns so it can be unit-tested without a repository.
 *
 * Roles:
 *  - "owner"    — the authenticated user owns the profile
 *  - "friend"   — accepted social relationship (placeholder, gated by social)
 *  - "stranger" — any non-owner viewer
 *  - "admin"    — placeholder, no runtime yet (see README)
 */
import type { ProfileVisibility } from "./dto";

export type ViewerRole = "owner" | "friend" | "stranger" | "admin";

/** Owner-only. Strangers never see private fields. */
export function canReadPrivateProfile(role: ViewerRole): boolean {
  return role === "owner";
}

/** Owner edits private profile. Admin path is reserved for future. */
export function canUpdatePrivateProfile(role: ViewerRole): boolean {
  return role === "owner";
}

/** Owner is the only path to complete onboarding. */
export function canCompleteOnboarding(role: ViewerRole): boolean {
  return role === "owner";
}

/**
 * Whether a viewer may see the public profile summary given the owner's
 * visibility setting. Public profiles are always visible to owner; friends-only
 * profiles hide from strangers; private profiles only show to owner.
 */
export function canReadPublicProfile(
  role: ViewerRole,
  visibility: ProfileVisibility,
): boolean {
  if (role === "owner" || role === "admin") return true;
  if (visibility === "public") return true;
  if (visibility === "friends") return role === "friend";
  return false;
}
