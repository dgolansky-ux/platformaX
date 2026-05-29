/**
 * communities-v2 — repository ports (internal). Concrete in-memory impl in
 * repository.ts; a DB adapter will implement the same interfaces later.
 */
import type {
  CommunityInviteStatus,
  CommunityRole,
  CommunityStatus,
  CommunityVisibility,
  JoinRequestStatus,
  MembershipStatus,
} from "./dto";

export type CommunityRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  visibility: CommunityVisibility;
  status: CommunityStatus;
  founderUserId: string;
  avatarRef: string | null;
  bannerRef: string | null;
  categorySlug: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type MembershipRecord = {
  communityId: string;
  userId: string;
  role: CommunityRole;
  status: MembershipStatus;
  joinedAt: string;
};

export type JoinRequestRecord = {
  id: string;
  communityId: string;
  requesterUserId: string;
  status: JoinRequestStatus;
  createdAt: string;
};

export interface CommunityRepository {
  create(record: CommunityRecord): Promise<CommunityRecord>;
  getById(id: string): Promise<CommunityRecord | null>;
  getBySlug(slug: string): Promise<CommunityRecord | null>;
  update(id: string, patch: Partial<CommunityRecord>): Promise<CommunityRecord>;
  listPublic(cursor: string | null, limit: number, categorySlug?: string | null): Promise<CommunityRecord[]>;
}

export interface MembershipRepository {
  add(record: MembershipRecord): Promise<void>;
  get(communityId: string, userId: string): Promise<MembershipRecord | null>;
  listForUser(userId: string): Promise<MembershipRecord[]>;
  listForCommunity(communityId: string): Promise<MembershipRecord[]>;
  updateRole(communityId: string, userId: string, role: MembershipRecord["role"]): Promise<MembershipRecord>;
  /** Hard-removes membership; the founder rule is enforced at the service layer. */
  remove(communityId: string, userId: string): Promise<void>;
}

export interface JoinRequestRepository {
  add(record: JoinRequestRecord): Promise<JoinRequestRecord>;
  findPending(communityId: string, requesterUserId: string): Promise<JoinRequestRecord | null>;
  getById(id: string): Promise<JoinRequestRecord | null>;
  update(id: string, patch: Partial<JoinRequestRecord>): Promise<JoinRequestRecord>;
  listPending(communityId: string): Promise<JoinRequestRecord[]>;
}

export type InviteRecord = {
  id: string;
  communityId: string;
  inviterUserId: string;
  invitedUserId: string | null;
  invitedEmail: string | null;
  status: CommunityInviteStatus;
  createdAt: string;
  expiresAt: string | null;
};

export interface InviteRepository {
  add(record: InviteRecord): Promise<InviteRecord>;
  getById(id: string): Promise<InviteRecord | null>;
  listForCommunity(communityId: string): Promise<InviteRecord[]>;
  findPendingForTarget(communityId: string, invitedUserId: string | null, invitedEmail: string | null): Promise<InviteRecord | null>;
  update(id: string, patch: Partial<InviteRecord>): Promise<InviteRecord>;
}

