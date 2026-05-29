/**
 * identity / professions — admin moderation SKELETON_ONLY.
 *
 * Pure status-transition logic + types for the future "approve / reject /
 * merge pending professions" admin screen. No persistence, no transport, no
 * UI here — only the rules, so they can be unit-tested before the dataset and
 * the admin surface land.
 */
import type { ProfessionProposalRecord, ProposalStatus } from "./dto";

export type ModerationDecision =
  | { kind: "approve" }
  | { kind: "reject" }
  | { kind: "merge"; intoSlug: string };

/** Only a pending proposal can be moderated. */
export function canModerate(status: ProposalStatus): boolean {
  return status === "pending";
}

const NEXT_STATUS: Record<ModerationDecision["kind"], ProposalStatus> = {
  approve: "approved",
  reject: "rejected",
  merge: "merged",
};

export type ModerationResult =
  | { ok: true; record: ProfessionProposalRecord }
  | { ok: false; code: "NOT_PENDING" | "MERGE_TARGET_REQUIRED" };

/** Pure transition. Returns the next record or a structured refusal. */
export function applyModeration(
  record: ProfessionProposalRecord,
  decision: ModerationDecision,
  now: string,
): ModerationResult {
  if (!canModerate(record.status)) return { ok: false, code: "NOT_PENDING" };
  if (decision.kind === "merge" && !decision.intoSlug) {
    return { ok: false, code: "MERGE_TARGET_REQUIRED" };
  }
  return {
    ok: true,
    record: {
      ...record,
      status: NEXT_STATUS[decision.kind],
      mergedIntoSlug: decision.kind === "merge" ? decision.intoSlug : record.mergedIntoSlug,
      // `now` reserved for an updatedAt column once a store exists.
      createdAt: record.createdAt || now,
    },
  };
}
