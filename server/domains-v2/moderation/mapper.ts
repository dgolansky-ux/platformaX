/**
 * moderation — internal mapper (record -> DTO).
 *
 * Public DTO `ModerationReportPublicStatusDTO` strips reporter / description /
 * severity / resolution metadata. Review DTO retains the full record (only
 * exposed behind `canReviewReports`).
 */
import type {
  ModerationActionDTO,
  ModerationReportPublicStatusDTO,
  ModerationReportReviewDTO,
} from "./dto";
import type {
  ModerationActionRecord,
  ModerationReportRecord,
} from "./repository";

export function toPublicStatusDTO(
  record: ModerationReportRecord,
): ModerationReportPublicStatusDTO {
  return {
    id: record.id,
    status: record.status,
    targetType: record.targetType,
    targetId: record.targetId,
    reason: record.reason,
    createdAt: record.createdAt,
  };
}

export function toReviewDTO(
  record: ModerationReportRecord,
): ModerationReportReviewDTO {
  return {
    id: record.id,
    reporterUserId: record.reporterUserId,
    targetType: record.targetType,
    targetId: record.targetId,
    targetOwnerUserId: record.targetOwnerUserId,
    reason: record.reason,
    description: record.description,
    status: record.status,
    severity: record.severity,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    reviewedByUserId: record.reviewedByUserId,
    reviewedAt: record.reviewedAt,
    resolutionNote: record.resolutionNote,
  };
}

export function toActionDTO(
  record: ModerationActionRecord,
): ModerationActionDTO {
  return {
    id: record.id,
    reportId: record.reportId,
    actorModeratorUserId: record.actorModeratorUserId,
    targetType: record.targetType,
    targetId: record.targetId,
    actionType: record.actionType,
    reasonNote: record.reasonNote,
    createdAt: record.createdAt,
  };
}
