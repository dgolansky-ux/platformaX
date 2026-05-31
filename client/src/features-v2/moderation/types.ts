/**
 * features-v2/moderation — public types for the UI surface (Slice 20).
 *
 * QUALITY_STRUCTURE_EXCEPTION — single canonical source of truth for the
 * UI-side moderation contract: target type / reason / severity / status /
 * action enums + the reason-definition registry + adapter + submit input /
 * result + review item + target preview + action + viewer + list filter +
 * list page. Splitting would either fragment the source of truth or create
 * cyclic type imports between the dialog / queue / adapter modules.
 * Registered in EXCEPTIONS_REGISTER.md (EXC-012).
 *
 * Mirrors the shape consumed by the moderation report dialog and the review
 * panel. Adapters convert between this shape and any backend transport — the
 * UI never imports `@server/*` directly.
 */

export type UiModerationTargetType =
  | "profile"
  | "friend_feed_post"
  | "friend_feed_comment"
  | "community"
  | "community_post"
  | "community_comment"
  | "channel"
  | "channel_post"
  | "channel_comment"
  | "workplace"
  | "workplace_post"
  | "important_event"
  | "profile_presentation_item"
  | "media_asset"
  | "module_item";

export type UiModerationReportReason =
  | "spam"
  | "harassment"
  | "inappropriate_content"
  | "impersonation"
  | "privacy_violation"
  | "illegal_or_dangerous"
  | "misinformation"
  | "other";

export type UiModerationReportSeverity = "low" | "medium" | "high";

export type UiModerationReportStatus =
  | "pending"
  | "under_review"
  | "dismissed"
  | "action_taken";

export type UiModerationActionType =
  | "dismiss_report"
  | "hide_content"
  | "deactivate_content"
  | "restore_content"
  | "mark_reviewed"
  | "restrict_visibility"
  | "no_action";

export interface UiModerationReportReason_Definition {
  key: UiModerationReportReason;
  label: string;
  description: string;
  requiresDescription: boolean;
}

export const UI_MODERATION_REPORT_REASONS: readonly UiModerationReportReason_Definition[] = [
  { key: "spam", label: "Spam", description: "Treść nachalna, powtarzana, reklamowa.", requiresDescription: false },
  { key: "harassment", label: "Nękanie lub atakowanie", description: "Treść skierowana przeciwko osobie, obraźliwa lub zastraszająca.", requiresDescription: false },
  { key: "inappropriate_content", label: "Treści nieodpowiednie", description: "Treść nieodpowiednia dla platformy.", requiresDescription: false },
  { key: "impersonation", label: "Podszywanie się", description: "Profil lub treść udaje inną osobę bądź podmiot.", requiresDescription: true },
  { key: "privacy_violation", label: "Naruszenie prywatności", description: "Ujawnia dane osobowe bez zgody.", requiresDescription: true },
  { key: "illegal_or_dangerous", label: "Treści niebezpieczne lub nielegalne", description: "Treść groźna, niebezpieczna lub naruszająca prawo.", requiresDescription: true },
  { key: "misinformation", label: "Fałszywe informacje", description: "Ewidentnie fałszywa albo wprowadzająca w błąd treść.", requiresDescription: true },
  { key: "other", label: "Inny powód", description: "Inny powód — opisz krótko, czego dotyczy zgłoszenie.", requiresDescription: true },
];

export interface UiReportSubmitInput {
  targetType: UiModerationTargetType;
  targetId: string;
  targetOwnerUserId: string | null;
  reason: UiModerationReportReason;
  description: string | null;
}

export interface UiReportPublicStatus {
  id: string;
  status: UiModerationReportStatus;
  targetType: UiModerationTargetType;
  targetId: string;
  reason: UiModerationReportReason;
  createdAt: string;
}

export interface UiReportReviewItem {
  id: string;
  reporterUserId: string;
  targetType: UiModerationTargetType;
  targetId: string;
  targetOwnerUserId: string | null;
  reason: UiModerationReportReason;
  description: string | null;
  status: UiModerationReportStatus;
  severity: UiModerationReportSeverity;
  createdAt: string;
  updatedAt: string;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  resolutionNote: string | null;
}

export interface UiReportTargetPreview {
  targetType: UiModerationTargetType;
  targetId: string;
  sourceDomain: string;
  publicPreviewStatus: "implemented" | "partial" | "planned";
  previewText: string | null;
  routeHint: string | null;
}

export interface UiReportAction {
  id: string;
  reportId: string;
  actorModeratorUserId: string;
  targetType: UiModerationTargetType;
  targetId: string;
  actionType: UiModerationActionType;
  reasonNote: string | null;
  createdAt: string;
}

export interface UiReportSubmitOk {
  ok: true;
  value: UiReportPublicStatus;
}

export interface UiReportSubmitError {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export type UiReportSubmitResult = UiReportSubmitOk | UiReportSubmitError;

export interface UiModerationListFilter {
  status?: UiModerationReportStatus;
  targetType?: UiModerationTargetType;
  reason?: UiModerationReportReason;
}

export interface UiModerationListPage {
  items: readonly UiReportReviewItem[];
  nextCursor: string | null;
}

export interface UiModerationViewer {
  userId: string | null;
  role: "user" | "moderator" | "admin";
}

export interface UiModerationAdapter {
  submitReport(
    viewer: UiModerationViewer,
    input: UiReportSubmitInput,
  ): Promise<UiReportSubmitResult>;
  listReviewQueue(
    viewer: UiModerationViewer,
    filter: UiModerationListFilter,
  ): Promise<UiModerationListPage>;
  getReviewDetails(
    viewer: UiModerationViewer,
    reportId: string,
  ): Promise<{
    report: UiReportReviewItem;
    actions: readonly UiReportAction[];
    targetPreview: UiReportTargetPreview;
  } | null>;
  applyAction(
    viewer: UiModerationViewer,
    input: {
      reportId: string;
      actionType: UiModerationActionType;
      reasonNote?: string | null;
    },
  ): Promise<
    | { ok: true; value: { report: UiReportReviewItem; action: UiReportAction } }
    | { ok: false; error: { code: string; message: string } }
  >;
}
