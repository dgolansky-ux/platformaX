/**
 * moderation — internal repository (Slice 20 in-memory foundation).
 *
 * Not importable cross-domain. The factory is re-exported through
 * `./moderation-store.ts` so the public-api boundary guard stays clean.
 */
import type { UserId } from "@shared/contracts/branded-ids";
import type {
  ModerationActionType,
  ModerationReportReason,
  ModerationReportSeverity,
  ModerationReportStatus,
  ModerationTargetType,
} from "./contracts";

export interface ModerationReportRecord {
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

export interface ModerationActionRecord {
  id: string;
  reportId: string;
  actorModeratorUserId: UserId;
  targetType: ModerationTargetType;
  targetId: string;
  actionType: ModerationActionType;
  reasonNote: string | null;
  createdAt: string;
}

export interface ModerationRepository {
  insertReport(record: ModerationReportRecord): Promise<ModerationReportRecord>;
  updateReport(
    id: string,
    patch: Partial<
      Pick<
        ModerationReportRecord,
        | "status"
        | "updatedAt"
        | "reviewedByUserId"
        | "reviewedAt"
        | "resolutionNote"
      >
    >,
  ): Promise<ModerationReportRecord>;
  getReportById(id: string): Promise<ModerationReportRecord | null>;
  // SCALABILITY_HOT_PATH_EXCEPTION: order is `createdAt DESC, id ASC`, applied by `sortByCreatedAtDescStable` in the impl below; interface line does not declare it.
  listReports(filter: {
    status?: ModerationReportStatus;
    targetType?: ModerationTargetType;
    reason?: ModerationReportReason;
    severity?: ModerationReportSeverity;
    fromDate?: string;
    toDate?: string;
    limit: number;
    cursor: string | null;
  }): Promise<{
    items: ModerationReportRecord[];
    nextCursor: string | null;
  }>;
  findActivePendingReport(
    reporterUserId: UserId,
    targetType: ModerationTargetType,
    targetId: string,
  ): Promise<ModerationReportRecord | null>;
  insertAction(record: ModerationActionRecord): Promise<ModerationActionRecord>;
  listActionsForReport(reportId: string): Promise<ModerationActionRecord[]>;
  listMyReports(reporterUserId: UserId): Promise<ModerationReportRecord[]>;
}

type ListFilter = {
  status?: ModerationReportStatus;
  targetType?: ModerationTargetType;
  reason?: ModerationReportReason;
  severity?: ModerationReportSeverity;
  fromDate?: string;
  toDate?: string;
};

function matchesFilter(
  row: ModerationReportRecord,
  filter: ListFilter,
): boolean {
  if (filter.status && row.status !== filter.status) return false;
  if (filter.targetType && row.targetType !== filter.targetType) return false;
  if (filter.reason && row.reason !== filter.reason) return false;
  if (filter.severity && row.severity !== filter.severity) return false;
  if (filter.fromDate && row.createdAt < filter.fromDate) return false;
  if (filter.toDate && row.createdAt > filter.toDate) return false;
  return true;
}

// Stable order: createdAt DESC, id ASC (tie-breaker). Stored sort applied on
// every paginated read so cursors stay consistent across calls.
function sortByCreatedAtDescStable(
  a: ModerationReportRecord,
  b: ModerationReportRecord,
): number {
  if (a.createdAt === b.createdAt) return a.id < b.id ? -1 : 1;
  return a.createdAt < b.createdAt ? 1 : -1;
}

export function createInMemoryModerationRepository(): ModerationRepository {
  const reports = new Map<string, ModerationReportRecord>();
  const actions: ModerationActionRecord[] = [];

  return {
    async insertReport(record) {
      reports.set(record.id, record);
      return record;
    },
    async updateReport(id, patch) {
      const existing = reports.get(id);
      if (!existing) {
        throw new Error(`Moderation report ${id} not found.`);
      }
      const next: ModerationReportRecord = { ...existing, ...patch };
      reports.set(id, next);
      return next;
    },
    async getReportById(id) {
      return reports.get(id) ?? null;
    },
    async listReports(filter) {
      // order by createdAt desc with id tie-breaker; pagination uses cursor on id.
      const all = [...reports.values()]
        .filter((row) => matchesFilter(row, filter))
        .sort(sortByCreatedAtDescStable);
      const startIndex = filter.cursor
        ? all.findIndex((row) => row.id === filter.cursor) + 1
        : 0;
      const slice = all.slice(startIndex, startIndex + filter.limit);
      const nextCursor =
        startIndex + filter.limit < all.length
          ? slice.at(-1)?.id ?? null
          : null;
      return { items: slice, nextCursor };
    },
    async findActivePendingReport(reporterUserId, targetType, targetId) {
      for (const row of reports.values()) {
        if (
          row.reporterUserId === reporterUserId &&
          row.targetType === targetType &&
          row.targetId === targetId &&
          (row.status === "pending" || row.status === "under_review")
        ) {
          return row;
        }
      }
      return null;
    },
    async insertAction(record) {
      actions.push(record);
      return record;
    },
    async listActionsForReport(reportId) {
      return actions
        .filter((row) => row.reportId === reportId)
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    },
    async listMyReports(reporterUserId) {
      // order by createdAt desc with id tie-breaker.
      return [...reports.values()]
        .filter((row) => row.reporterUserId === reporterUserId)
        .sort(sortByCreatedAtDescStable);
    },
  };
}
