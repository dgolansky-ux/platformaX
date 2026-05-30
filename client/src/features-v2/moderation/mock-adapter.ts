/**
 * features-v2/moderation — in-memory mock adapter for the UI shell.
 *
 * Mirrors `application-v2/use-cases/moderation` semantics: viewer must be
 * authenticated to submit; only moderator/admin viewers may list/act. Lives
 * here as a UI-side adapter so the UI never imports `@server/*`.
 *
 * Replace with a real transport adapter when the runtime lands.
 */
import {
  UI_MODERATION_REPORT_REASONS,
  type UiModerationAdapter,
  type UiModerationListPage,
  type UiModerationViewer,
  type UiReportAction,
  type UiReportPublicStatus,
  type UiReportReviewItem,
  type UiReportSubmitInput,
  type UiReportSubmitResult,
  type UiReportTargetPreview,
} from "./types";

const reportsById = new Map<string, UiReportReviewItem>();
const actionsByReport = new Map<string, UiReportAction[]>();

function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function severityFromReason(
  reason: UiReportSubmitInput["reason"],
): UiReportReviewItem["severity"] {
  if (
    reason === "harassment" ||
    reason === "privacy_violation" ||
    reason === "illegal_or_dangerous" ||
    reason === "impersonation"
  ) {
    return "high";
  }
  if (reason === "inappropriate_content" || reason === "misinformation") {
    return "medium";
  }
  return "low";
}

function reasonDefinition(reason: UiReportSubmitInput["reason"]) {
  return UI_MODERATION_REPORT_REASONS.find((r) => r.key === reason) ?? null;
}

function validateSubmit(input: UiReportSubmitInput): { ok: true } | { ok: false; code: string; message: string } {
  const def = reasonDefinition(input.reason);
  if (!def) return { ok: false, code: "UNKNOWN_REASON", message: "Nieznany powód zgłoszenia." };
  if (def.requiresDescription) {
    const trimmed = (input.description ?? "").trim();
    if (trimmed.length < 4) {
      return { ok: false, code: "INVALID_DESCRIPTION", message: "Opis jest wymagany dla tego powodu." };
    }
  }
  return { ok: true };
}

function toPublicStatus(item: UiReportReviewItem): UiReportPublicStatus {
  return {
    id: item.id,
    status: item.status,
    targetType: item.targetType,
    targetId: item.targetId,
    reason: item.reason,
    createdAt: item.createdAt,
  };
}

function fallbackPreview(item: UiReportReviewItem): UiReportTargetPreview {
  return {
    targetType: item.targetType,
    targetId: item.targetId,
    sourceDomain: "mock",
    publicPreviewStatus: "partial",
    previewText: `Podgląd celu jest częściowy (mock adapter, slice 20).`,
    routeHint: null,
  };
}

function isReviewer(viewer: UiModerationViewer): boolean {
  return viewer.role === "moderator" || viewer.role === "admin";
}

export const moderationMockAdapter: UiModerationAdapter = {
  async submitReport(viewer, input) {
    if (!viewer.userId) {
      return {
        ok: false,
        error: { code: "NOT_AUTHORIZED", message: "Zaloguj się, żeby zgłosić treść." },
      } satisfies UiReportSubmitResult;
    }
    const validation = validateSubmit(input);
    if (!validation.ok) {
      return { ok: false, error: { code: validation.code, message: validation.message } };
    }
    // duplicate pending check
    for (const row of reportsById.values()) {
      if (
        row.reporterUserId === viewer.userId &&
        row.targetType === input.targetType &&
        row.targetId === input.targetId &&
        (row.status === "pending" || row.status === "under_review")
      ) {
        return {
          ok: false,
          error: {
            code: "DUPLICATE_PENDING_REPORT",
            message: "Już istnieje aktywne zgłoszenie tego elementu.",
          },
        };
      }
    }
    const timestamp = nowIso();
    const record: UiReportReviewItem = {
      id: createId("mod"),
      reporterUserId: viewer.userId,
      targetType: input.targetType,
      targetId: input.targetId,
      targetOwnerUserId: input.targetOwnerUserId,
      reason: input.reason,
      description: input.description?.trim() ? input.description.trim() : null,
      status: "pending",
      severity: severityFromReason(input.reason),
      createdAt: timestamp,
      updatedAt: timestamp,
      reviewedByUserId: null,
      reviewedAt: null,
      resolutionNote: null,
    };
    reportsById.set(record.id, record);
    return { ok: true, value: toPublicStatus(record) };
  },

  async listReviewQueue(viewer, filter): Promise<UiModerationListPage> {
    if (!isReviewer(viewer)) {
      return { items: [], nextCursor: null };
    }
    const all = [...reportsById.values()]
      .filter((row) => {
        if (filter.status && row.status !== filter.status) return false;
        if (filter.targetType && row.targetType !== filter.targetType) return false;
        if (filter.reason && row.reason !== filter.reason) return false;
        return true;
      })
      // ordered by createdAt desc — id tie-breaker for stable cursor pagination.
      .sort((a, b) => (a.createdAt === b.createdAt ? (a.id < b.id ? 1 : -1) : a.createdAt < b.createdAt ? 1 : -1));
    return { items: all, nextCursor: null };
  },

  async getReviewDetails(viewer, reportId) {
    if (!isReviewer(viewer)) return null;
    const report = reportsById.get(reportId);
    if (!report) return null;
    return {
      report,
      actions: actionsByReport.get(reportId) ?? [],
      targetPreview: fallbackPreview(report),
    };
  },

  async applyAction(viewer, input) {
    if (!viewer.userId || !isReviewer(viewer)) {
      return { ok: false, error: { code: "NOT_AUTHORIZED", message: "Brak uprawnień." } };
    }
    const report = reportsById.get(input.reportId);
    if (!report) {
      return { ok: false, error: { code: "REPORT_NOT_FOUND", message: "Zgłoszenie nie znaleziono." } };
    }
    const timestamp = nowIso();
    let nextStatus: UiReportReviewItem["status"] = report.status;
    switch (input.actionType) {
      case "dismiss_report":
        nextStatus = "dismissed";
        break;
      case "mark_reviewed":
        if (report.status === "pending") nextStatus = "under_review";
        break;
      case "hide_content":
      case "deactivate_content":
      case "restrict_visibility":
        nextStatus = "action_taken";
        break;
      default:
        nextStatus = report.status;
    }
    const updated: UiReportReviewItem = {
      ...report,
      status: nextStatus,
      updatedAt: timestamp,
      reviewedByUserId: viewer.userId,
      reviewedAt: timestamp,
      resolutionNote:
        input.reasonNote && input.reasonNote.trim().length > 0
          ? input.reasonNote.trim()
          : report.resolutionNote,
    };
    reportsById.set(report.id, updated);
    const action: UiReportAction = {
      id: createId("act"),
      reportId: report.id,
      actorModeratorUserId: viewer.userId,
      targetType: report.targetType,
      targetId: report.targetId,
      actionType: input.actionType,
      reasonNote: input.reasonNote ?? null,
      createdAt: timestamp,
    };
    const list = actionsByReport.get(report.id) ?? [];
    list.push(action);
    actionsByReport.set(report.id, list);
    return { ok: true, value: { report: updated, action } };
  },
};
