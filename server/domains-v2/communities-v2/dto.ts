/**
 * communities-v2 — DTOs + input types.
 * Status: BACKEND_PARTIAL (in-memory runtime).
 *
 * privacy classification: Public DTO — communities carry NO PII (no
 * email/phone/dateOfBirth). Membership user ids are references, not PII.
 */

export type CommunityVisibility = "public" | "private";
export type CommunityStatus = "active" | "archived" | "deleted";
export type CommunityRole = "founder" | "admin" | "moderator" | "member";
export type MembershipStatus = "active" | "pending" | "removed";
export type JoinRequestStatus = "pending" | "accepted" | "rejected";

/** Public community card — safe for anonymous viewers. No PII. */
export type CommunityPublicDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  visibility: CommunityVisibility;
  status: CommunityStatus;
  memberCount: number;
  avatarRef: string | null;
  bannerRef: string | null;
};

/** Owner/admin view: adds the viewer's role. Authorized users only. */
export type CommunityAdminDTO = CommunityPublicDTO & {
  founderUserId: string;
  viewerRole: CommunityRole | null;
};

export type CommunityMemberDTO = {
  communityId: string;
  userId: string;
  role: CommunityRole;
  status: MembershipStatus;
  joinedAt: string;
};

export type CommunityJoinRequestDTO = {
  id: string;
  communityId: string;
  requesterUserId: string;
  status: JoinRequestStatus;
  createdAt: string;
};

export type CreateCommunityInput = {
  founderUserId: string;
  name: string;
  slug: string;
  description?: string;
  visibility?: CommunityVisibility;
};

export type UpdateCommunitySettingsInput = {
  actorUserId: string;
  communityId: string;
  name?: string;
  description?: string;
  visibility?: CommunityVisibility;
};
