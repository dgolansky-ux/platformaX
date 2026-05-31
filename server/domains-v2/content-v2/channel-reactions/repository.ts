import type { ChannelReactionTargetRef, ChannelReactionTargetType, ChannelReactionType } from "./dto";
import { CHANNEL_REACTION_TYPES } from "./dto";
import { channelReactionKey } from "./policy";

function channelReactionTargetKey(targetType: string, targetId: string): string {
  return `${targetType}|${targetId}`;
}

export type ChannelReactionRecord = {
  id: string;
  targetType: ChannelReactionTargetType;
  targetId: string;
  userId: string;
  reactionType: ChannelReactionType;
  createdAt: string;
  updatedAt: string;
  uniqueKey: string;
};

export interface ChannelReactionRepository {
  upsert(record: ChannelReactionRecord): Promise<{ record: ChannelReactionRecord; created: boolean }>;
  remove(targetType: ChannelReactionTargetType, targetId: string, userId: string, reactionType: ChannelReactionType): Promise<boolean>;
  findOne(targetType: ChannelReactionTargetType, targetId: string, userId: string, reactionType: ChannelReactionType): Promise<ChannelReactionRecord | null>;
  countsByTarget(targets: readonly ChannelReactionTargetRef[]): Promise<Map<string, Record<ChannelReactionType, number>>>;
  viewerStateByTarget(userId: string, targets: readonly ChannelReactionTargetRef[]): Promise<Map<string, readonly ChannelReactionType[]>>;
}

function zeroCounts(): Record<ChannelReactionType, number> {
  const out = {} as Record<ChannelReactionType, number>;
  for (const type of CHANNEL_REACTION_TYPES) out[type] = 0;
  return out;
}

export function createInMemoryChannelReactionRepository(): ChannelReactionRepository {
  const rows = new Map<string, ChannelReactionRecord>();
  const byKey = new Map<string, string>();
  return {
    async upsert(record) {
      const existingId = byKey.get(record.uniqueKey);
      if (existingId) return { record: rows.get(existingId) as ChannelReactionRecord, created: false };
      rows.set(record.id, record);
      byKey.set(record.uniqueKey, record.id);
      return { record, created: true };
    },
    async remove(targetType, targetId, userId, reactionType) {
      const uniqueKey = channelReactionKey(targetType, targetId, userId, reactionType);
      const id = byKey.get(uniqueKey);
      if (!id) return false;
      byKey.delete(uniqueKey);
      rows.delete(id);
      return true;
    },
    async findOne(targetType, targetId, userId, reactionType) {
      const id = byKey.get(channelReactionKey(targetType, targetId, userId, reactionType));
      return id ? rows.get(id) ?? null : null;
    },
    async countsByTarget(targets) {
      const out = new Map<string, Record<ChannelReactionType, number>>();
      for (const target of targets) out.set(channelReactionTargetKey(target.targetType, target.targetId), zeroCounts());
      for (const row of rows.values()) {
        const bucket = out.get(channelReactionTargetKey(row.targetType, row.targetId));
        if (bucket) bucket[row.reactionType] = (bucket[row.reactionType] ?? 0) + 1;
      }
      return out;
    },
    async viewerStateByTarget(userId, targets) {
      const out = new Map<string, ChannelReactionType[]>();
      for (const target of targets) out.set(channelReactionTargetKey(target.targetType, target.targetId), []);
      for (const row of rows.values()) {
        if (row.userId !== userId) continue;
        const bucket = out.get(channelReactionTargetKey(row.targetType, row.targetId));
        if (bucket) bucket.push(row.reactionType);
      }
      const frozen = new Map<string, readonly ChannelReactionType[]>();
      for (const [key, value] of out.entries()) frozen.set(key, value);
      return frozen;
    },
  };
}
