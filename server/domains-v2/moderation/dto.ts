/**
 * moderation — data transfer objects (Slice 20 foundation).
 *
 * privacy classification: Public + Review (moderator-only).
 *
 * Carries report metadata only — never raw target PII, never reporter PII, never
 * moderator PII. Description is moderator-only via `ModerationReportReviewDTO`.
 */
import type { UserId } from "@shared/contracts/branded-ids";
import type {
  ModerationActionType,
  ModerationReportReason,
  ModerationReportSeverity,
  ModerationReportStatus,
  ModerationTargetType,
} from "./contracts";

/**
 * Public DTO returned to the reporter after they create a report — just enough
 * to confirm receipt + own-report status lookups. NEVER includes the target
 * owner's identity beyond what the reporter already saw on the source surface.
 */
export interface ModerationReportPublicStatusDTO {
  id: string;
  status: ModerationReportStatus;
  targetType: ModerationTargetType;
  targetId: string;
  reason: ModerationReportReason;
  createdAt: string;
}

/**
 * Moderator-only review DTO — adds reporter id, description, severity, and
 * resolution metadata. Restricted to roles with `canReviewReports`.
 */
export interface ModerationReportReviewDTO {
  id: string;
  reporterUserId: UserId;
  targetType: ModerationTargetType;
  targetId: string;
  targetOwnerUserId: UserId | null;
  reason: ModerationReportReason;
  description: string | null;
  status: ModerationReportStatus;
  severity: ModerationReportSeverity;
  createdAt: string;
  updatedAt: string;
  reviewedByUserId: UserId | null;
  reviewedAt: string | null;
  resolutionNote: string | null;
}

/** Bounded preview of the reported target — no raw PII, only id + minimal context. */
export interface ModerationTargetPreviewDTO {
  targetType: ModerationTargetType;
  targetId: string;
  sourceDomain: string;
  publicPreviewStatus: "implemented" | "partial" | "planned";
  /** Short, safe-rendered preview text (max 200 chars). Null when only id is known. */
  previewText: string | null;
  /** Internal route hint for moderator navigation, NOT a user-facing URL. */
  routeHint: string | null;
}

/** Action recorded against a report by a moderator/admin. */
export interface ModerationActionDTO {
  id: string;
  reportId: string;
  actorModeratorUserId: UserId;
  targetType: ModerationTargetType;
  targetId: string;
  actionType: ModerationActionType;
  reasonNote: string | null;
  createdAt: string;
}

/** Input to create a new report (user-facing). */
export interface CreateModerationReportInput {
  reporterUserId: UserId;
  targetType: ModerationTargetType;
  targetId: string;
  targetOwnerUserId: UserId | null;
  reason: ModerationReportReason;
  description: string | null;
}

/** Filters for the moderator queue. */
export interface ListModerationReportsInput {
  status?: ModerationReportStatus;
  targetType?: ModerationTargetType;
  reason?: ModerationReportReason;
  severity?: ModerationReportSeverity;
  fromDate?: string;
  toDate?: string;
  cursor?: string;
  limit?: number;
}

/** Input for a moderator action against a report. */
export interface ModerateReportActionInput {
  reportId: string;
  actorModeratorUserId: UserId;
  actionType: ModerationActionType;
  reasonNote?: string | null;
}

/** Result shape returned by service operations. */
export type ModerationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ModerationErrorCode; message: string } };

export type ModerationErrorCode =
  | "UNKNOWN_TARGET_TYPE"
  | "UNKNOWN_REASON"
  | "DUPLICATE_PENDING_REPORT"
  | "REPORT_NOT_FOUND"
  | "SELF_REPORT_NOT_ALLOWED"
  | "INVALID_DESCRIPTION"
  | "NOT_AUTHORIZED"
  | "ACTION_NOT_SUPPORTED_BY_TARGET"
  | "INVALID_STATUS_TRANSITION";

/** Aggregate page returned to the moderator queue. */
export interface ModerationReportListDTO {
  items: readonly ModerationReportReviewDTO[];
  nextCursor: string | null;
}
