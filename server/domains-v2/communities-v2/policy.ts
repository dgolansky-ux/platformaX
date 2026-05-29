/**
 * communities-v2 — pure policy. No I/O, no time, no side effects.
 */
import type { CommunityRole } from "./dto";
import type { MembershipRecord } from "./ports";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidCommunitySlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

const RANK: Record<CommunityRole, number> = {
  founder: 3,
  admin: 2,
  moderator: 1,
  member: 0,
};

/** Founder + admin may change community settings. */
export function canUpdateSettings(role: CommunityRole | null): boolean {
  return role === "founder" || role === "admin";
}

/** Founder + admin may manage members. */
export function canManageMembers(role: CommunityRole | null): boolean {
  return role === "founder" || role === "admin";
}

/**
 * An actor may remove a target only if the actor outranks the target AND the
 * target is NOT the founder. The founder can never be removed by anyone.
 */
export function canRemoveMember(
  actor: Pick<MembershipRecord, "role">,
  target: Pick<MembershipRecord, "role">,
): boolean {
  if (target.role === "founder") return false;
  if (!canManageMembers(actor.role)) return false;
  return RANK[actor.role] > RANK[target.role];
}

/** Authority for cross-domain actions (e.g. channels): founder/admin only. */
export function hasCommunityAuthority(role: CommunityRole | null): boolean {
  return role === "founder" || role === "admin";
}

/**
 * A role change is permitted only when the actor outranks BOTH the target's
 * current role and the next role. Founder is never touched by this path
 * (callers reject any attempt to assign or revoke founder).
 */
export function canChangeRole(
  actorRole: CommunityRole | null,
  targetCurrentRole: CommunityRole,
  nextRole: CommunityRole,
): boolean {
  if (!canManageMembers(actorRole)) return false;
  if (targetCurrentRole === "founder" || nextRole === "founder") return false;
  const actor = actorRole ? RANK[actorRole] : -1;
  return actor > RANK[targetCurrentRole] && actor > RANK[nextRole];
}
