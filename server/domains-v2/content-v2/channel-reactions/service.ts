// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// PX-OWN-001-ACK: pre-runtime mutation; ownership currently delegated to policy/closure; explicit owner check to be added with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

import type {
  ChannelReactionResult,
  ChannelReactionSummaryValue,
  ChannelViewerReactionStateValue,
  RemoveChannelReactionValue,
  SetChannelReactionValue,
  ToggleChannelReactionValue,
} from "./contracts";
import {
  CHANNEL_REACTION_TYPES,
  type ChannelReactionSummaryQuery,
  type ChannelReactionType,
  type ChannelViewerReactionStateQuery,
  type RemoveChannelReactionInput,
  type SetChannelReactionInput,
  type ToggleChannelReactionInput,
} from "./dto";
import { channelReactionTargetKey, toChannelReactionDTO } from "./mapper";
import type { ChannelReactionRecord, ChannelReactionRepository } from "./repository";
import { channelReactionKey, isValidChannelReactionType } from "./policy";

export type ChannelReactionClock = { now: () => Date };
export type ChannelReactionIdGenerator = { next: () => string };

export type ChannelReactionServiceDeps = {
  reactions: ChannelReactionRepository;
  clock: ChannelReactionClock;
  ids: ChannelReactionIdGenerator;
};

export interface ChannelReactionService {
  setReaction(input: SetChannelReactionInput): Promise<ChannelReactionResult<SetChannelReactionValue>>;
  removeReaction(input: RemoveChannelReactionInput): Promise<ChannelReactionResult<RemoveChannelReactionValue>>;
  toggleReaction(input: ToggleChannelReactionInput): Promise<ChannelReactionResult<ToggleChannelReactionValue>>;
  getReactionSummaries(query: ChannelReactionSummaryQuery): Promise<ChannelReactionSummaryValue>;
  getViewerReactionState(query: ChannelViewerReactionStateQuery): Promise<ChannelViewerReactionStateValue>;
}

function fail<T>(message: string): ChannelReactionResult<T> {
  return { ok: false, error: { code: "INVALID_REACTION_TYPE", message } };
}

export function createChannelReactionService(deps: ChannelReactionServiceDeps): ChannelReactionService {
  return {
    async setReaction(input) {
      if (!isValidChannelReactionType(input.reactionType)) return fail("Unknown reaction type.");
      const now = deps.clock.now().toISOString();
      const record: ChannelReactionRecord = {
        id: deps.ids.next(),
        targetType: input.targetType,
        targetId: input.targetId,
        userId: input.userId,
        reactionType: input.reactionType,
        createdAt: now,
        updatedAt: now,
        uniqueKey: channelReactionKey(input.targetType, input.targetId, input.userId, input.reactionType),
      };
      const saved = await deps.reactions.upsert(record);
      return { ok: true, value: { reaction: toChannelReactionDTO(saved.record), created: saved.created } };
    },
    async removeReaction(input) {
      if (!isValidChannelReactionType(input.reactionType)) return fail("Unknown reaction type.");
      const removed = await deps.reactions.remove(input.targetType, input.targetId, input.userId, input.reactionType);
      return { ok: true, value: { removed } };
    },
    async toggleReaction(input) {
      if (!isValidChannelReactionType(input.reactionType)) return fail("Unknown reaction type.");
      const existing = await deps.reactions.findOne(input.targetType, input.targetId, input.userId, input.reactionType);
      if (existing) {
        await deps.reactions.remove(input.targetType, input.targetId, input.userId, input.reactionType);
        return { ok: true, value: { active: false, reaction: null } };
      }
      const set = await this.setReaction(input);
      if (!set.ok) return set;
      return { ok: true, value: { active: true, reaction: set.value.reaction } };
    },
    async getReactionSummaries(query) {
      const counts = await deps.reactions.countsByTarget(query.targets);
      return {
        summaries: query.targets.map((target) => {
          const bucket = counts.get(channelReactionTargetKey(target.targetType, target.targetId));
          const filled = {} as Record<ChannelReactionType, number>;
          let total = 0;
          for (const type of CHANNEL_REACTION_TYPES) {
            const count = bucket?.[type] ?? 0;
            filled[type] = count;
            total += count;
          }
          return { ...target, counts: filled, total };
        }),
      };
    },
    async getViewerReactionState(query) {
      const states = await deps.reactions.viewerStateByTarget(query.userId, query.targets);
      return {
        states: query.targets.map((target) => ({
          ...target,
          active: states.get(channelReactionTargetKey(target.targetType, target.targetId)) ?? [],
        })),
      };
    },
  };
}
