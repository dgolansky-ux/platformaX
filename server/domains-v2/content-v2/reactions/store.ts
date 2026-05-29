/**
 * content-v2 / reactions — in-memory adapter (READ_MODEL_SKELETON). DB adapter
 * implements the same ports later. `uniqueKey` enforces idempotent set
 * reactions; counts are computed by GROUP BY-style aggregation here, replaced
 * by a single DB query later.
 */
import { REACTION_TYPES, type ReactionType } from "./dto";
import { targetKey } from "./mapper";
import type { ReactionRecord, ReactionRepository } from "./ports";
import { reactionKey } from "./policy";

function zeroCounts(): Record<ReactionType, number> {
  const out = {} as Record<ReactionType, number>;
  for (const t of REACTION_TYPES) out[t] = 0;
  return out;
}

export function createInMemoryReactionRepository(): ReactionRepository {
  const rows = new Map<string, ReactionRecord>();
  const byKey = new Map<string, string>(); // uniqueKey → id

  return {
    async upsert(record) {
      const existing = byKey.get(record.uniqueKey);
      if (existing) {
        return { record: rows.get(existing) as ReactionRecord, created: false };
      }
      rows.set(record.id, record);
      byKey.set(record.uniqueKey, record.id);
      return { record, created: true };
    },
    async remove(targetType, targetId, userId, reactionType) {
      const k = reactionKey(targetType, targetId, userId, reactionType);
      const id = byKey.get(k);
      if (!id) return false;
      byKey.delete(k);
      rows.delete(id);
      return true;
    },
    async findOne(targetType, targetId, userId, reactionType) {
      const id = byKey.get(reactionKey(targetType, targetId, userId, reactionType));
      return id ? (rows.get(id) ?? null) : null;
    },
    async countsByTarget(targets) {
      // SCALABILITY_EXCEPTION: bounded by caller (UI page = ≤50 items); a DB
      // adapter replaces this with GROUP BY (target_type, target_id, reaction_type).
      const out = new Map<string, Record<ReactionType, number>>();
      for (const t of targets) out.set(targetKey(t.targetType, t.targetId), zeroCounts());
      for (const r of rows.values()) {
        const k = targetKey(r.targetType, r.targetId);
        const bucket = out.get(k);
        if (bucket) bucket[r.reactionType] = (bucket[r.reactionType] ?? 0) + 1;
      }
      return out;
    },
    async viewerStateByTarget(userId, targets) {
      const out = new Map<string, ReactionType[]>();
      for (const t of targets) out.set(targetKey(t.targetType, t.targetId), []);
      for (const r of rows.values()) {
        if (r.userId !== userId) continue;
        const k = targetKey(r.targetType, r.targetId);
        const arr = out.get(k);
        if (arr) arr.push(r.reactionType);
      }
      const frozen = new Map<string, readonly ReactionType[]>();
      for (const [k, v] of out.entries()) frozen.set(k, v);
      return frozen;
    },
  };
}
