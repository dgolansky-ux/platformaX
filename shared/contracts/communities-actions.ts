/**
 * shared/contracts/communities-actions — MOCK_LOCAL_ONLY adapter input shapes
 * and the shared action result envelope used by the communities-v2 UI.
 *
 * privacy classification: Public DTO inputs. No PII.
 */
import type { CommunityRole } from "./community-roles";

export type CreateCommunityInput = {
  name: string;
  slug: string;
  description?: string;
  visibility?: "public" | "private";
  categorySlug?: string | null;
  tags?: readonly string[];
  topic?: string;
  locationMode?: "online" | "stationary" | "hybrid" | null;
  locationCity?: string;
};

export type UpdateCommunitySettingsInput = {
  slug: string;
  name?: string;
  description?: string;
  visibility?: "public" | "private";
};

export type CreateCommunityChannelInput = {
  communitySlug: string;
  slug: string;
  name: string;
  description?: string;
  visibility?: "public" | "private";
};

export type DecideJoinRequestInput = {
  communitySlug: string;
  joinRequestId: string;
};

export type ToggleCommunityModuleInput = {
  communitySlug: string;
  moduleKey: string;
  enabled: boolean;
};

export type ChangeCommunityMemberRoleInput = {
  communitySlug: string;
  targetUserId: string;
  nextRole: Exclude<CommunityRole, "founder">;
};

export type CommunityActionError =
  | { code: "VALIDATION"; field: string; message: string }
  | { code: "CONFLICT"; message: string }
  | { code: "FORBIDDEN"; message: string }
  | { code: "NOT_FOUND"; message: string }
  | { code: "UNKNOWN"; message: string };

export type CommunityActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: CommunityActionError };
