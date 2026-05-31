// === Slice 24 PRE-runtime ACK marker (EXC-016) ======================
// PX-OWN-001-ACK: pre-runtime mutation; ownership currently delegated to policy/closure; explicit owner check to be added with transactional outbox slice. EXC-016.
// === end Slice 24 ACK marker =======================================

import type { UserId } from "@shared/contracts/branded-ids";

export type FriendshipStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "removed"
  | "blocked";

export type FriendshipRecord = {
  id: string;
  requesterUserId: UserId;
  recipientUserId: UserId;
  status: FriendshipStatus;
  createdAt: string;
  respondedAt: string | null;
  updatedAt: string;
};

export type BlockedUserRecord = {
  id: string;
  blockerUserId: UserId;
  blockedUserId: UserId;
  reason?: string;
  createdAt: string;
  revokedAt: string | null;
};

export interface SocialRelationshipRepository {
  createFriendship(record: FriendshipRecord): Promise<FriendshipRecord>;
  updateFriendship(
    id: string,
    patch: Partial<Pick<FriendshipRecord, "status" | "respondedAt" | "updatedAt">>,
  ): Promise<FriendshipRecord>;
  getFriendshipById(id: string): Promise<FriendshipRecord | null>;
  listFriendshipsByUser(userId: UserId): Promise<FriendshipRecord[]>;
  listFriendshipsBetween(a: UserId, b: UserId): Promise<FriendshipRecord[]>;
  listFriendshipsByStatusForUser(
    userId: UserId,
    status: FriendshipStatus,
  ): Promise<FriendshipRecord[]>;
  upsertBlock(record: BlockedUserRecord): Promise<BlockedUserRecord>;
  getActiveBlock(
    blockerUserId: UserId,
    blockedUserId: UserId,
  ): Promise<BlockedUserRecord | null>;
  listActiveBlocksByBlocker(blockerUserId: UserId): Promise<BlockedUserRecord[]>;
}

export function createInMemorySocialRelationshipRepository(): SocialRelationshipRepository {
  const friendships = new Map<string, FriendshipRecord>();
  const blocks = new Map<string, BlockedUserRecord>();
  const blockKey = (blockerUserId: UserId, blockedUserId: UserId) =>
    `${blockerUserId}->${blockedUserId}`;

  return {
    async createFriendship(record) {
      friendships.set(record.id, record);
      return record;
    },

    async updateFriendship(id, patch) {
      const existing = friendships.get(id);
      if (!existing) {
        throw new Error(`Friendship ${id} not found.`);
      }
      const next: FriendshipRecord = { ...existing, ...patch };
      friendships.set(id, next);
      return next;
    },

    async getFriendshipById(id) {
      return friendships.get(id) ?? null;
    },

    async listFriendshipsByUser(userId) {
      return [...friendships.values()].filter(
        (row) => row.requesterUserId === userId || row.recipientUserId === userId,
      );
    },

    async listFriendshipsBetween(a, b) {
      return [...friendships.values()].filter(
        (row) =>
          (row.requesterUserId === a && row.recipientUserId === b) ||
          (row.requesterUserId === b && row.recipientUserId === a),
      );
    },

    async listFriendshipsByStatusForUser(userId, status) {
      return [...friendships.values()].filter(
        (row) =>
          row.status === status &&
          (row.requesterUserId === userId || row.recipientUserId === userId),
      );
    },

    async upsertBlock(record) {
      blocks.set(blockKey(record.blockerUserId, record.blockedUserId), record);
      return record;
    },

    async getActiveBlock(blockerUserId, blockedUserId) {
      const row = blocks.get(blockKey(blockerUserId, blockedUserId)) ?? null;
      if (!row || row.revokedAt) return null;
      return row;
    },

    async listActiveBlocksByBlocker(blockerUserId) {
      return [...blocks.values()].filter(
        (row) => row.blockerUserId === blockerUserId && row.revokedAt === null,
      );
    },
  };
}