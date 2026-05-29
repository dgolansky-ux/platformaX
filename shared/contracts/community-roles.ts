/**
 * shared/contracts/community-roles — leaf module for the community role union.
 *
 * Extracted so that both `communities.ts` and `communities-actions.ts` can
 * depend on it WITHOUT importing each other (breaks the no-circular cycle
 * communities ↔ communities-actions). No imports of its own.
 *
 * privacy classification: not data — a role enum.
 */
export type CommunityRole = "founder" | "admin" | "moderator" | "member";
