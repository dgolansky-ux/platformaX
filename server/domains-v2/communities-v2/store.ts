/**
 * communities-v2 — in-memory repository adapters. A DB adapter will implement
 * the same ports later (status BACKEND_PARTIAL).
 */
import type {
  CommunityRecord,
  CommunityRepository,
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
    async listPublic(cursor, limit) {
      const all = [...rows.values()]
        .filter((r) => !r.deletedAt && r.visibility === "public" && r.status === "active")
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
  };
}
