// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// PX-OWN-001-ACK: pre-runtime mutation; ownership currently delegated to policy/closure; explicit owner check to be added with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * content-v2 / reactions — service. Owns reactions on feed items + comments.
 * NO role checks (application-v2 enforces visibility before calling here).
 * Set is idempotent (duplicate setReaction is a no-op + `created=false`);
 * toggleReaction flips state in one call; summaries + viewer state are
 * batched to avoid N+1.
 */
import type {
  ReactionErrorCode,
  ReactionResult,
  RemoveReactionValue,
  SetReactionValue,
  SummaryValue,
  ToggleReactionValue,
  ViewerStateValue,
} from "./contracts";
import {
  REACTION_TYPES,
  type ReactionType,
  type RemoveReactionInput,
  type SetReactionInput,
  type SummaryQuery,
  type ToggleReactionInput,
  type ViewerStateQuery,
} from "./dto";
import { targetKey, toReactionDTO } from "./mapper";
import type { ReactionRecord, ReactionRepository } from "./ports";
import { isValidReactionType, reactionKey } from "./policy";

export type ReactionClock = { now: () => Date };
export type ReactionIdGenerator = { next: () => string };

export type ReactionServiceDeps = {
  repo: ReactionRepository;
  clock: ReactionClock;
  ids: ReactionIdGenerator;
};

function fail<T>(code: ReactionErrorCode, message: string): ReactionResult<T> {
  return { ok: false, error: { code, message } };
}

export interface ReactionService {
  setReaction(input: SetReactionInput): Promise<ReactionResult<SetReactionValue>>;
  removeReaction(input: RemoveReactionInput): Promise<ReactionResult<RemoveReactionValue>>;
  toggleReaction(input: ToggleReactionInput): Promise<ReactionResult<ToggleReactionValue>>;
  getReactionSummaries(query: SummaryQuery): Promise<SummaryValue>;
  getViewerReactionState(query: ViewerStateQuery): Promise<ViewerStateValue>;
}

async function setReaction(deps: ReactionServiceDeps, input: SetReactionInput): Promise<ReactionResult<SetReactionValue>> {
  if (!isValidReactionType(input.reactionType)) return fail("INVALID_REACTION_TYPE", "Unknown reaction type.");
  const now = deps.clock.now().toISOString();
  const record: ReactionRecord = {
    id: deps.ids.next(),
    targetType: input.targetType,
    targetId: input.targetId,
    userId: input.userId,
    reactionType: input.reactionType,
    createdAt: now,
    uniqueKey: reactionKey(input.targetType, input.targetId, input.userId, input.reactionType),
  };
  const { record: saved, created } = await deps.repo.upsert(record);
  return { ok: true, value: { reaction: toReactionDTO(saved), created } };
}

async function removeReaction(deps: ReactionServiceDeps, input: RemoveReactionInput): Promise<ReactionResult<RemoveReactionValue>> {
  if (!isValidReactionType(input.reactionType)) return fail("INVALID_REACTION_TYPE", "Unknown reaction type.");
  const removed = await deps.repo.remove(input.targetType, input.targetId, input.userId, input.reactionType);
  return { ok: true, value: { removed } };
}

async function toggleReaction(deps: ReactionServiceDeps, input: ToggleReactionInput): Promise<ReactionResult<ToggleReactionValue>> {
  if (!isValidReactionType(input.reactionType)) return fail("INVALID_REACTION_TYPE", "Unknown reaction type.");
  const existing = await deps.repo.findOne(input.targetType, input.targetId, input.userId, input.reactionType);
  if (existing) {
    await deps.repo.remove(input.targetType, input.targetId, input.userId, input.reactionType);
    return { ok: true, value: { active: false, reaction: null } };
  }
  const setRes = await setReaction(deps, input);
  if (!setRes.ok) return setRes as unknown as ReactionResult<ToggleReactionValue>;
  return { ok: true, value: { active: true, reaction: setRes.value.reaction } };
}

async function getReactionSummaries(deps: ReactionServiceDeps, query: SummaryQuery): Promise<SummaryValue> {
  const counts = await deps.repo.countsByTarget(query.targets);
  const summaries = query.targets.map((t) => {
    const bucket = counts.get(targetKey(t.targetType, t.targetId)) ?? ({} as Record<ReactionType, number>);
    const filled = {} as Record<ReactionType, number>;
    let total = 0;
    for (const rt of REACTION_TYPES) {
      const n = bucket[rt] ?? 0;
      filled[rt] = n;
      total += n;
    }
    return { targetType: t.targetType, targetId: t.targetId, counts: filled, total };
  });
  return { summaries };
}

async function getViewerReactionState(deps: ReactionServiceDeps, query: ViewerStateQuery): Promise<ViewerStateValue> {
  const m = await deps.repo.viewerStateByTarget(query.userId, query.targets);
  const states = query.targets.map((t) => ({
    targetType: t.targetType,
    targetId: t.targetId,
    active: m.get(targetKey(t.targetType, t.targetId)) ?? [],
  }));
  return { states };
}

export function createReactionService(deps: ReactionServiceDeps): ReactionService {
  return {
    setReaction: (input) => setReaction(deps, input),
    removeReaction: (input) => removeReaction(deps, input),
    toggleReaction: (input) => toggleReaction(deps, input),
    getReactionSummaries: (query) => getReactionSummaries(deps, query),
    getViewerReactionState: (query) => getViewerReactionState(deps, query),
  };
}
