// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

// ALLOW_FILE_SIZE_EXCEPTION + QUALITY_STRUCTURE_EXCEPTION — Slice 20
// moderation foundation co-locates the create-report flow, the moderator
// review/list/details flow, and the dismiss / mark-under-review / take-action
// flow in a single factory so the in-memory mock + future repository adapter
// share one closure over repository / publisher / clock / createId.
// Registered in EXCEPTIONS_REGISTER.md (EXC-012).
/**
 * moderation — internal service factory (Slice 20 foundation).
 *
 * Owns: create report, queue listing, review actions, action persistence.
 * Does NOT own: target content state — that lives in the source domain and is
 * mutated via `application-v2/use-cases/moderation` calling the source
 * domain's public-api (e.g. content-v2 friend-posts deactivate).
 */
import {
  findReportReasonDefinition,
  findTargetDefinition,
  type ModerationActionType,
  type ModerationReportReason,
  type ModerationReportSeverity,
  type ModerationReportStatus,
} from "./contracts";
import type {
  CreateModerationReportInput,
  ListModerationReportsInput,
  ModerateReportActionInput,
  ModerationActionDTO,
  ModerationErrorCode,
  ModerationReportListDTO,
  ModerationReportPublicStatusDTO,
  ModerationReportReviewDTO,
  ModerationResult,
} from "./dto";
import {
  canTransitionReportStatus,
  validateCreateReportInput,
  type ModerationActor,
  canCreateReport,
  canReviewReports,
  canTakeAction,
} from "./policy";
import {
  createInMemoryModerationRepository,
  type ModerationRepository,
} from "./repository";
import {
  toActionDTO,
  toPublicStatusDTO,
  toReviewDTO,
} from "./mapper";
import {
  createNoopModerationEventPublisher,
  type ModerationEventPublisher,
} from "./events";

export type ModerationClock = () => Date;
export type ModerationIdGen = () => string;

export interface ModerationServiceDeps {
  repository?: ModerationRepository;
  publisher?: ModerationEventPublisher;
  clock?: ModerationClock;
  createId?: ModerationIdGen;
  correlationIdGen?: () => string;
}

export interface ModerationService {
  createReport(
    actor: ModerationActor,
    input: CreateModerationReportInput,
  ): Promise<ModerationResult<ModerationReportPublicStatusDTO>>;
  listForReview(
    actor: ModerationActor,
    input: ListModerationReportsInput,
  ): Promise<ModerationResult<ModerationReportListDTO>>;
  getReviewDetails(
    actor: ModerationActor,
    reportId: string,
  ): Promise<
    ModerationResult<{
      report: ModerationReportReviewDTO;
      actions: readonly ModerationActionDTO[];
    }>
  >;
  applyReviewAction(
    actor: ModerationActor,
    input: ModerateReportActionInput,
  ): Promise<
    ModerationResult<{
      report: ModerationReportReviewDTO;
      action: ModerationActionDTO;
    }>
  >;
  listMyReports(
    actor: ModerationActor,
  ): Promise<ModerationResult<readonly ModerationReportPublicStatusDTO[]>>;
}

function ok<T>(value: T): ModerationResult<T> {
  return { ok: true, value };
}

function fail<T>(
  code: ModerationErrorCode,
  message: string,
): ModerationResult<T> {
  return { ok: false, error: { code, message } };
}

function nowIso(clock: ModerationClock): string {
  return clock().toISOString();
}

function deriveSeverityFromReason(
  reason: ModerationReportReason,
): ModerationReportSeverity {
  const def = findReportReasonDefinition(reason);
  return def?.severityDefault ?? "low";
}

function deriveNewStatusFromAction(
  current: ModerationReportStatus,
  action: ModerationActionType,
): ModerationReportStatus {
  switch (action) {
    case "dismiss_report":
      return "dismissed";
    case "mark_reviewed":
      return current === "pending" ? "under_review" : current;
    case "hide_content":
    case "deactivate_content":
    case "restrict_visibility":
      return "action_taken";
    case "restore_content":
    case "no_action":
      return current;
  }
}

export function createModerationService(
  deps: ModerationServiceDeps = {},
): ModerationService {
  const repository = deps.repository ?? createInMemoryModerationRepository();
  const publisher = deps.publisher ?? createNoopModerationEventPublisher();
  const clock = deps.clock ?? (() => new Date());
  const createId =
    deps.createId ?? (() => `mod_${Math.random().toString(36).slice(2, 12)}`);
  const correlationId =
    deps.correlationIdGen ?? (() => `cor_${Math.random().toString(36).slice(2, 10)}`);

  return {
    async createReport(actor, input) {
      if (!canCreateReport(actor)) {
        return fail("NOT_AUTHORIZED", "Authentication required to file a report.");
      }
      const isSelfTarget =
        input.targetType === "profile" &&
        input.targetId === input.reporterUserId;
      const validation = validateCreateReportInput({
        reporterUserId: input.reporterUserId,
        targetType: input.targetType,
        reason: input.reason,
        description: input.description,
        isSelfTarget,
      });
      if (!validation.ok) {
        return fail(validation.code, "Invalid moderation report input.");
      }
      if (!findTargetDefinition(input.targetType)) {
        return fail("UNKNOWN_TARGET_TYPE", "Unknown target type.");
      }
      const duplicate = await repository.findActivePendingReport(
        input.reporterUserId,
        input.targetType,
        input.targetId,
      );
      if (duplicate) {
        return fail(
          "DUPLICATE_PENDING_REPORT",
          "A pending report from this reporter for this target already exists.",
        );
      }
      const timestamp = nowIso(clock);
      const severity = deriveSeverityFromReason(input.reason);
      const record = await repository.insertReport({
        id: createId(),
        reporterUserId: input.reporterUserId,
        targetType: input.targetType,
        targetId: input.targetId,
        targetOwnerUserId: input.targetOwnerUserId,
        reason: input.reason,
        description: input.description?.trim() ? input.description.trim() : null,
        status: "pending",
        severity,
        createdAt: timestamp,
        updatedAt: timestamp,
        reviewedByUserId: null,
        reviewedAt: null,
        resolutionNote: null,
      });
      await publisher.publish({
        type: "ModerationReportCreated",
        reportId: record.id,
        reporterUserId: record.reporterUserId,
        targetType: record.targetType,
        targetId: record.targetId,
        targetOwnerUserId: record.targetOwnerUserId,
        reason: record.reason,
        severity: record.severity,
        occurredAt: timestamp,
        correlationId: correlationId(),
      });
      return ok(toPublicStatusDTO(record));
    },

    // SCALABILITY_HOT_PATH_EXCEPTION: list orders by createdAt DESC (id tie-breaker) in the repository — see `sortByCreatedAtDescStable`.
    async listForReview(actor, input) {
      if (!canReviewReports(actor)) {
        return fail("NOT_AUTHORIZED", "Only moderators can view the queue.");
      }
      const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
      // SCALABILITY_HOT_PATH_EXCEPTION: order is createdAt-stable; cursor is the last-seen report id.
      const page = await repository.listReports({
        status: input.status,
        targetType: input.targetType,
        reason: input.reason,
        severity: input.severity,
        fromDate: input.fromDate,
        toDate: input.toDate,
        limit,
        cursor: input.cursor ?? null,
      });
      return ok({
        items: page.items.map(toReviewDTO),
        nextCursor: page.nextCursor,
      });
    },

    async getReviewDetails(actor, reportId) {
      if (!canReviewReports(actor)) {
        return fail("NOT_AUTHORIZED", "Only moderators can view the queue.");
      }
      const record = await repository.getReportById(reportId);
      if (!record) {
        return fail("REPORT_NOT_FOUND", "Report not found.");
      }
      // SCALABILITY_HOT_PATH_EXCEPTION: list of actions for a single report; order is createdAt ASC in the repository, set bounded by per-report capacity.
      const actions = await repository.listActionsForReport(reportId);
      return ok({
        report: toReviewDTO(record),
        actions: actions.map(toActionDTO),
      });
    },

    async applyReviewAction(actor, input) {
      if (!canTakeAction(actor) || !actor.userId) {
        return fail("NOT_AUTHORIZED", "Only moderators can take actions.");
      }
      const record = await repository.getReportById(input.reportId);
      if (!record) {
        return fail("REPORT_NOT_FOUND", "Report not found.");
      }
      const targetDef = findTargetDefinition(record.targetType);
      if (!targetDef) {
        return fail(
          "UNKNOWN_TARGET_TYPE",
          "Unknown target type on stored report.",
        );
      }
      if (
        (input.actionType === "hide_content" && !targetDef.canHide) ||
        (input.actionType === "deactivate_content" && !targetDef.canDeactivate) ||
        (input.actionType === "restore_content" && !targetDef.canRestore)
      ) {
        return fail(
          "ACTION_NOT_SUPPORTED_BY_TARGET",
          `Action ${input.actionType} not supported by target ${record.targetType}.`,
        );
      }
      const nextStatus = deriveNewStatusFromAction(record.status, input.actionType);
      if (!canTransitionReportStatus(record.status, nextStatus)) {
        return fail(
          "INVALID_STATUS_TRANSITION",
          `Cannot transition from ${record.status} to ${nextStatus}.`,
        );
      }
      const timestamp = nowIso(clock);
      const action = await repository.insertAction({
        id: createId(),
        reportId: record.id,
        actorModeratorUserId: actor.userId,
        targetType: record.targetType,
        targetId: record.targetId,
        actionType: input.actionType,
        reasonNote: input.reasonNote ?? null,
        createdAt: timestamp,
      });
      const updated = await repository.updateReport(record.id, {
        status: nextStatus,
        updatedAt: timestamp,
        reviewedByUserId: actor.userId,
        reviewedAt: timestamp,
        resolutionNote:
          input.reasonNote && input.reasonNote.trim().length > 0
            ? input.reasonNote.trim()
            : record.resolutionNote,
      });
      await publisher.publish({
        type: "ModerationReportReviewed",
        reportId: record.id,
        actorModeratorUserId: actor.userId,
        newStatus: nextStatus,
        occurredAt: timestamp,
        correlationId: correlationId(),
      });
      if (input.actionType !== "mark_reviewed" && input.actionType !== "no_action") {
        await publisher.publish({
          type: "ModerationActionTaken",
          reportId: record.id,
          actionId: action.id,
          actorModeratorUserId: actor.userId,
          targetType: record.targetType,
          targetId: record.targetId,
          actionType: input.actionType,
          occurredAt: timestamp,
          correlationId: correlationId(),
        });
      }
      return ok({ report: toReviewDTO(updated), action: toActionDTO(action) });
    },

    async listMyReports(actor) {
      if (!actor.userId) {
        return fail("NOT_AUTHORIZED", "Authentication required.");
      }
      const rows = await repository.listMyReports(actor.userId);
      return ok(rows.map(toPublicStatusDTO));
    },
  };
}
