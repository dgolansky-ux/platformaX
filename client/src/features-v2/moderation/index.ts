/**
 * features-v2/moderation — UI feature barrel (Slice 20).
 */
export { ReportDialog } from "./ReportDialog";
export { ReportButton, ReportMenuItem } from "./ReportButton";
export { ModerationQueuePage } from "./ModerationQueuePage";
export { moderationMockAdapter } from "./mock-adapter";
export {
  UI_MODERATION_REPORT_REASONS,
  type UiModerationActionType,
  type UiModerationAdapter,
  type UiModerationListFilter,
  type UiModerationListPage,
  type UiModerationReportReason,
  type UiModerationReportReason_Definition,
  type UiModerationReportSeverity,
  type UiModerationReportStatus,
  type UiModerationTargetType,
  type UiModerationViewer,
  type UiReportAction,
  type UiReportPublicStatus,
  type UiReportReviewItem,
  type UiReportSubmitInput,
  type UiReportSubmitResult,
  type UiReportTargetPreview,
} from "./types";
