/**
 * channels — repository ports (internal). In-memory impl in store.ts. A DB
 * adapter implements the same interfaces later.
 */
import type {
  ChannelLeadPermission,
  ChannelLeadRole,
  ChannelLeadStatus,
} from "./contracts";
import type {
  ChannelOwnerType,
  ChannelStatus,
  ChannelVisibility,
  FollowStatus,
} from "./dto";
import type { ChannelCommentPolicyDTO, ChannelModerationPolicyDTO } from "./interaction-settings";

export type ChannelRecord = {
  id: string;
  ownerType: ChannelOwnerType;
  ownerId: string;
  slug: string;
  name: string;
  description: string;
  visibility: ChannelVisibility;
  status: ChannelStatus;
  createdAt: string;
  updatedAt: string;
};

export type ChannelLeadRecord = {
  channelId: string;
  userId: string;
  role: ChannelLeadRole;
  permissions: readonly ChannelLeadPermission[];
  status: ChannelLeadStatus;
  assignedByUserId: string;
  assignedAt: string;
};

export type FollowRecord = {
  channelId: string;
  followerUserId: string;
  status: FollowStatus;
  createdAt: string;
};

export type ChannelInteractionSettingsRecord = {
  channelId: string;
  commentsEnabled: boolean;
  reactionsEnabled: boolean;
  commentPolicy: ChannelCommentPolicyDTO;
  moderationPolicy: ChannelModerationPolicyDTO;
  updatedAt: string;
};

export interface ChannelRepository {
  create(record: ChannelRecord): Promise<ChannelRecord>;
  getById(id: string): Promise<ChannelRecord | null>;
  findByOwnerSlug(ownerId: string, slug: string): Promise<ChannelRecord | null>;
  listForOwner(ownerId: string, cursor: string | null, limit: number): Promise<ChannelRecord[]>;
  /** Public directory scan — active channels only, stable id order, cursor. */
  listAllActive(cursor: string | null, limit: number): Promise<ChannelRecord[]>;
  update(id: string, patch: { name?: string; description?: string; visibility?: ChannelVisibility; updatedAt: string }): Promise<ChannelRecord | null>;
  archive(id: string, updatedAt: string): Promise<ChannelRecord | null>;
}

export interface ChannelLeadRepository {
  /** Idempotent: re-assigning an existing active lead returns the existing
   * record with `created=false`. Reactivating a previously-revoked lead is
   * allowed and counts as a create. */
  upsert(record: ChannelLeadRecord): Promise<{ record: ChannelLeadRecord; created: boolean }>;
  /** Returns true if a row was revoked (was active before the call). */
  revoke(channelId: string, userId: string, updatedAt: string): Promise<boolean>;
  updatePermissions(channelId: string, userId: string, permissions: readonly ChannelLeadPermission[]): Promise<ChannelLeadRecord | null>;
  findActive(channelId: string, userId: string): Promise<ChannelLeadRecord | null>;
  listActiveForChannel(channelId: string): Promise<ChannelLeadRecord[]>;
  countActiveForChannel(channelId: string): Promise<number>;
  listChannelsLedByUser(userId: string): Promise<ChannelLeadRecord[]>;
}

export interface FollowRepository {
  upsert(record: FollowRecord): Promise<void>;
  get(channelId: string, followerUserId: string): Promise<FollowRecord | null>;
  countActive(channelId: string): Promise<number>;
  listActiveForUser(userId: string): Promise<FollowRecord[]>;
}

export interface ChannelInteractionSettingsRepository {
  get(channelId: string): Promise<ChannelInteractionSettingsRecord | null>;
  upsert(record: ChannelInteractionSettingsRecord): Promise<ChannelInteractionSettingsRecord>;
}
