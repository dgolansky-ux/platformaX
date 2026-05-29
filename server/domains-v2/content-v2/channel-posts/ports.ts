import type { ChannelPostStatus } from "./dto";

export type ChannelPostRecord = {
  id: string;
  channelId: string;
  authorUserId: string;
  body: string;
  mediaRefs: readonly string[];
  status: ChannelPostStatus;
  pinned: boolean;
  pinnedAt?: string;
  pinnedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export interface ChannelPostRepository {
  create(record: ChannelPostRecord): Promise<ChannelPostRecord>;
  getById(id: string): Promise<ChannelPostRecord | null>;
  update(record: ChannelPostRecord): Promise<ChannelPostRecord>;
  clearPinnedForChannel(channelId: string, exceptPostId: string | null): Promise<void>;
  getPinnedForChannel(channelId: string): Promise<ChannelPostRecord | null>;
  listForChannel(channelId: string, cursor: string | null, limit: number): Promise<ChannelPostRecord[]>;
}
