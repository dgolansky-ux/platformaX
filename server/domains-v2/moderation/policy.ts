/**
 * moderation — policy (Slice 20 foundation).
 *
 * Pure RBAC + invariants. No persistence, no IO. Internal to the moderation
 * domain — not importable cross-domain.
 */
import type { UserId } from "@shared/contracts/branded-ids";
import { findReportReasonDefinition, isKnownReportReason, isKnownTargetType } from "./contracts";

export type PlatformRole = "user" | "moderator" | "admin";

export interface ModerationActor {
  userId: UserId | null;
  role: PlatformRole;
}

/** A user must be authenticated to file a report. */
export function canCreateReport(actor: ModerationActor): boolean {
  return actor.userId !== null;
}

/** Moderator + admin only — never normal users. */
export function canReviewReports(actor: ModerationActor): boolean {
  return actor.role === "moderator" || actor.role === "admin";
}

/** Only the actor that has review power may take a moderator action. */
export function canTakeAction(actor: ModerationActor): boolean {
  return canReviewReports(actor);
}

/** Owner of a report can ALWAYS check the public status of their own report. */
export function canViewOwnReportStatus(actor: ModerationActor): boolean {
  return actor.userId !== null;
}

/**
 * Self-reporting policy: a user cannot report their own profile / own content
 * by default. Specific surfaces (e.g. media asset visible to others) may relax
 * this in the future, but the default is `false`.
 */
export function canReportSelfTarget(): boolean {
  return false;
}

/** Length cap for the optional user-supplied description. */
export const MODERATION_DESCRIPTION_MAX_CHARS = 1000;

/** Validate inbound input shape — pure, returns either OK or an error code. */
export function validateCreateReportInput(input: {
  reporterUserId: UserId | null;
  targetType: string;
  reason: string;
  description: string | null;
  isSelfTarget: boolean;
}):
  | { ok: true }
  | {
      ok: false;
      code:
        | "UNKNOWN_TARGET_TYPE"
        | "UNKNOWN_REASON"
        | "INVALID_DESCRIPTION"
        | "SELF_REPORT_NOT_ALLOWED"
        | "NOT_AUTHORIZED";
    } {
  if (!input.reporterUserId) {
    return { ok: false, code: "NOT_AUTHORIZED" };
  }
  if (!isKnownTargetType(input.targetType)) {
    return { ok: false, code: "UNKNOWN_TARGET_TYPE" };
  }
  if (!isKnownReportReason(input.reason)) {
    return { ok: false, code: "UNKNOWN_REASON" };
  }
  if (input.isSelfTarget && !canReportSelfTarget()) {
    return { ok: false, code: "SELF_REPORT_NOT_ALLOWED" };
  }
  const reasonDef = findReportReasonDefinition(input.reason);
  if (reasonDef?.requiresDescription) {
    const trimmed = (input.description ?? "").trim();
    if (trimmed.length < 4 || trimmed.length > MODERATION_DESCRIPTION_MAX_CHARS) {
      return { ok: false, code: "INVALID_DESCRIPTION" };
    }
  } else if (input.description && input.description.length > MODERATION_DESCRIPTION_MAX_CHARS) {
    return { ok: false, code: "INVALID_DESCRIPTION" };
  }
  return { ok: true };
}

/** State transition map for ModerationReportStatus. */
export function canTransitionReportStatus(
  from: "pending" | "under_review" | "dismissed" | "action_taken",
  to: "pending" | "under_review" | "dismissed" | "action_taken",
): boolean {
  if (from === to) return true;
  if (from === "dismissed" || from === "action_taken") return false;
  if (to === "pending") return false;
  return true;
}
