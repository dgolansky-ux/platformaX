/**
 * channels — repository ports (internal). In-memory impl in store.ts.
 */
import type {
  ChannelOwnerType,
  ChannelStatus,
  ChannelVisibility,
  FollowStatus,
} from "./dto";

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

export type FollowRecord = {
  channelId: string;
  followerUserId: string;
  status: FollowStatus;
  createdAt: string;
};

export interface ChannelRepository {
  create(record: ChannelRecord): Promise<ChannelRecord>;
  getById(id: string): Promise<ChannelRecord | null>;
  findByOwnerSlug(ownerId: string, slug: string): Promise<ChannelRecord | null>;
  listForOwner(ownerId: string, cursor: string | null, limit: number): Promise<ChannelRecord[]>;
}

export interface FollowRepository {
  upsert(record: FollowRecord): Promise<void>;
  get(channelId: string, followerUserId: string): Promise<FollowRecord | null>;
  countActive(channelId: string): Promise<number>;
}
