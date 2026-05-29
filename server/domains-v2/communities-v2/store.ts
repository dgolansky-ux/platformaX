/**
 * communities-v2 — in-memory repository adapters. A DB adapter will implement
 * the same ports later (status BACKEND_PARTIAL).
 */
import type {
  CommunityRecord,
  CommunityRepository,
  InviteRecord,
  InviteRepository,
  JoinRequestRecord,
  JoinRequestRepository,
  MembershipRecord,
  MembershipRepository,
} from "./ports";

export function createInMemoryCommunityRepository(): CommunityRepository {
  const rows = new Map<string, CommunityRecord>();
  const slugs = new Map<string, string>();
  return {
    async create(record) {
      rows.set(record.id, record);
      slugs.set(record.slug, record.id);
      return record;
    },
    async getById(id) {
      const r = rows.get(id);
      return r && !r.deletedAt ? r : null;
    },
    async getBySlug(slug) {
      const id = slugs.get(slug);
      return id ? (rows.get(id) ?? null) : null;
    },
    async update(id, patch) {
      const existing = rows.get(id);
      if (!existing) throw new Error(`community ${id} not found`);
      const next = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      rows.set(id, next);
      return next;
    },
    async listPublic(cursor, limit, categorySlug) {
      const all = [...rows.values()]
        .filter((r) => !r.deletedAt && r.visibility === "public" && r.status === "active")
        .filter((r) => !categorySlug || r.categorySlug === categorySlug)
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      const start = cursor ? all.findIndex((r) => r.id === cursor) + 1 : 0;
      return all.slice(start, start + limit);
    },
  };
}

export function createInMemoryMembershipRepository(): MembershipRepository {
  const rows = new Map<string, MembershipRecord>();
  const key = (c: string, u: string) => `${c}|${u}`;
  return {
    async add(record) {
      rows.set(key(record.communityId, record.userId), record);
    },
    async get(communityId, userId) {
      return rows.get(key(communityId, userId)) ?? null;
    },
    async listForUser(userId) {
      return [...rows.values()].filter((m) => m.userId === userId && m.status === "active");
    },
    async listForCommunity(communityId) {
      return [...rows.values()].filter((m) => m.communityId === communityId && m.status === "active");
    },
    async updateRole(communityId, userId, role) {
      const existing = rows.get(key(communityId, userId));
      if (!existing) throw new Error(`membership ${communityId}/${userId} not found`);
      const next: MembershipRecord = { ...existing, role };
      rows.set(key(communityId, userId), next);
      return next;
    },
    async remove(communityId, userId) {
      rows.delete(key(communityId, userId));
    },
  };
}

export function createInMemoryJoinRequestRepository(): JoinRequestRepository {
  const rows = new Map<string, JoinRequestRecord>();
  return {
    async add(record) {
      rows.set(record.id, record);
      return record;
    },
    async findPending(communityId, requesterUserId) {
      return (
        [...rows.values()].find(
          (r) =>
            r.communityId === communityId &&
            r.requesterUserId === requesterUserId &&
            r.status === "pending",
        ) ?? null
      );
    },
    async getById(id) {
      return rows.get(id) ?? null;
    },
    async update(id, patch) {
      const existing = rows.get(id);
      if (!existing) throw new Error(`join request ${id} not found`);
      const next: JoinRequestRecord = { ...existing, ...patch };
      rows.set(id, next);
      return next;
    },
    async listPending(communityId) {
      return [...rows.values()]
        .filter((r) => r.communityId === communityId && r.status === "pending")
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    },
  };
}

export function createInMemoryInviteRepository(): InviteRepository {
  const rows = new Map<string, InviteRecord>();
  return {
    async add(record) {
      rows.set(record.id, record);
      return record;
    },
    async getById(id) {
      return rows.get(id) ?? null;
    },
    async listForCommunity(communityId) {
      return [...rows.values()]
        .filter((r) => r.communityId === communityId)
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    },
    async findPendingForTarget(communityId, invitedUserId, invitedEmail) {
      return (
        [...rows.values()].find(
          (r) =>
            r.communityId === communityId &&
            r.status === "pending" &&
            ((invitedUserId !== null && r.invitedUserId === invitedUserId) ||
              (invitedEmail !== null && r.invitedEmail === invitedEmail)),
        ) ?? null
      );
    },
    async update(id, patch) {
      const existing = rows.get(id);
      if (!existing) throw new Error(`invite ${id} not found`);
      const next: InviteRecord = { ...existing, ...patch };
      rows.set(id, next);
      return next;
    },
  };
}
