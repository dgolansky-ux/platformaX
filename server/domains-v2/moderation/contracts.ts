/**
 * moderation — contracts (Slice 20 foundation).
 *
 * QUALITY_STRUCTURE_EXCEPTION — single canonical source of truth for the
 * moderation cross-domain surface: target-type + reason enums, severity /
 * status / action enums, the per-target capability registry, and the per-reason
 * definition registry. Splitting would either fragment the source of truth
 * across 4–5 files or create cyclic enum imports between the dto / events /
 * service layers. Registered in EXCEPTIONS_REGISTER.md (EXC-012).
 *
 * Cross-domain contract types: report reasons, target types, statuses, action
 * kinds. Other domains / use-cases import ONLY from here (no internal modules).
 */

/** All target kinds the platform can report against. */
export type ModerationTargetType =
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

export const MODERATION_TARGET_TYPES: readonly ModerationTargetType[] = [
  "profile",
  "friend_feed_post",
  "friend_feed_comment",
  "community",
  "community_post",
  "community_comment",
  "channel",
  "channel_post",
  "channel_comment",
  "workplace",
  "workplace_post",
  "important_event",
  "profile_presentation_item",
  "media_asset",
  "module_item",
] as const;

/** All report reason keys. */
export type ModerationReportReason =
  | "spam"
  | "harassment"
  | "inappropriate_content"
  | "impersonation"
  | "privacy_violation"
  | "illegal_or_dangerous"
  | "misinformation"
  | "other";

export const MODERATION_REPORT_REASONS: readonly ModerationReportReason[] = [
  "spam",
  "harassment",
  "inappropriate_content",
  "impersonation",
  "privacy_violation",
  "illegal_or_dangerous",
  "misinformation",
  "other",
] as const;

/** Severity buckets, used for prioritization in the review queue. */
export type ModerationReportSeverity = "low" | "medium" | "high";

/** Lifecycle of a single moderation report. */
export type ModerationReportStatus =
  | "pending"
  | "under_review"
  | "dismissed"
  | "action_taken";

/** Action taken by a moderator on a reported target. */
export type ModerationActionType =
  | "dismiss_report"
  | "hide_content"
  | "deactivate_content"
  | "restore_content"
  | "mark_reviewed"
  | "restrict_visibility"
  | "no_action";

/** Implementation status of a per-target moderation action surface. */
export type ModerationTargetActionStatus =
  | "implemented"
  | "partial"
  | "planned";

/** Per-target capability metadata used by the review panel. */
export interface ModerationTargetDefinition {
  targetType: ModerationTargetType;
  sourceDomain: string;
  canReport: boolean;
  canHide: boolean;
  canDeactivate: boolean;
  canRestore: boolean;
  publicPreviewStatus: ModerationTargetActionStatus;
  routeTargetBuilderId: string;
}

/** Reason definition used by the report dialog and validation. */
export interface ModerationReportReasonDefinition {
  key: ModerationReportReason;
  label: string;
  description: string;
  severityDefault: ModerationReportSeverity;
  requiresDescription: boolean;
  allowedTargetTypes: readonly ModerationTargetType[] | "all";
}

export const MODERATION_REPORT_REASON_DEFINITIONS: readonly ModerationReportReasonDefinition[] = [
  {
    key: "spam",
    label: "Spam",
    description: "Treść nachalna, powtarzana, reklamowa.",
    severityDefault: "low",
    requiresDescription: false,
    allowedTargetTypes: "all",
  },
  {
    key: "harassment",
    label: "Nękanie lub atakowanie",
    description: "Treść skierowana przeciwko osobie, obraźliwa lub zastraszająca.",
    severityDefault: "high",
    requiresDescription: false,
    allowedTargetTypes: "all",
  },
  {
    key: "inappropriate_content",
    label: "Treści nieodpowiednie",
    description: "Treść nieodpowiednia dla platformy lub publicznej widoczności.",
    severityDefault: "medium",
    requiresDescription: false,
    allowedTargetTypes: "all",
  },
  {
    key: "impersonation",
    label: "Podszywanie się",
    description: "Profil lub treść udaje inną osobę bądź podmiot.",
    severityDefault: "high",
    requiresDescription: true,
    allowedTargetTypes: "all",
  },
  {
    key: "privacy_violation",
    label: "Naruszenie prywatności",
    description: "Treść ujawnia dane osobowe albo prywatne informacje bez zgody.",
    severityDefault: "high",
    requiresDescription: true,
    allowedTargetTypes: "all",
  },
  {
    key: "illegal_or_dangerous",
    label: "Treści niebezpieczne lub nielegalne",
    description: "Treść groźna, niebezpieczna lub naruszająca prawo.",
    severityDefault: "high",
    requiresDescription: true,
    allowedTargetTypes: "all",
  },
  {
    key: "misinformation",
    label: "Fałszywe lub wprowadzające w błąd informacje",
    description: "Treść zawiera ewidentnie fałszywe lub szkodliwie wprowadzające w błąd informacje.",
    severityDefault: "medium",
    requiresDescription: true,
    allowedTargetTypes: "all",
  },
  {
    key: "other",
    label: "Inny powód",
    description: "Inny powód, opisany przez użytkownika.",
    severityDefault: "low",
    requiresDescription: true,
    allowedTargetTypes: "all",
  },
] as const;

/** Per-target registry (single source of truth for the queue/panel). */
export const MODERATION_TARGET_DEFINITIONS: readonly ModerationTargetDefinition[] = [
  {
    targetType: "profile",
    sourceDomain: "identity",
    canReport: true,
    canHide: false,
    canDeactivate: false,
    canRestore: false,
    publicPreviewStatus: "partial",
    routeTargetBuilderId: "profile",
  },
  {
    targetType: "friend_feed_post",
    sourceDomain: "content-v2/friend-posts",
    canReport: true,
    canHide: true,
    canDeactivate: true,
    canRestore: false,
    publicPreviewStatus: "implemented",
    routeTargetBuilderId: "friend_feed_post",
  },
  {
    targetType: "friend_feed_comment",
    sourceDomain: "content-v2/friend-posts",
    canReport: true,
    canHide: true,
    canDeactivate: true,
    canRestore: false,
    publicPreviewStatus: "implemented",
    routeTargetBuilderId: "friend_feed_comment",
  },
  {
    targetType: "community",
    sourceDomain: "communities-v2",
    canReport: true,
    canHide: false,
    canDeactivate: false,
    canRestore: false,
    publicPreviewStatus: "partial",
    routeTargetBuilderId: "community",
  },
  {
    targetType: "community_post",
    sourceDomain: "content-v2/community-feeds",
    canReport: true,
    canHide: true,
    canDeactivate: true,
    canRestore: false,
    publicPreviewStatus: "partial",
    routeTargetBuilderId: "community_post",
  },
  {
    targetType: "community_comment",
    sourceDomain: "content-v2/comments",
    canReport: true,
    canHide: true,
    canDeactivate: true,
    canRestore: false,
    publicPreviewStatus: "partial",
    routeTargetBuilderId: "community_comment",
  },
  {
    targetType: "channel",
    sourceDomain: "channels",
    canReport: true,
    canHide: false,
    canDeactivate: false,
    canRestore: false,
    publicPreviewStatus: "partial",
    routeTargetBuilderId: "channel",
  },
  {
    targetType: "channel_post",
    sourceDomain: "content-v2/channel-posts",
    canReport: true,
    canHide: true,
    canDeactivate: true,
    canRestore: false,
    publicPreviewStatus: "partial",
    routeTargetBuilderId: "channel_post",
  },
  {
    targetType: "channel_comment",
    sourceDomain: "content-v2/channel-comments",
    canReport: true,
    canHide: true,
    canDeactivate: true,
    canRestore: false,
    publicPreviewStatus: "partial",
    routeTargetBuilderId: "channel_comment",
  },
  {
    targetType: "workplace",
    sourceDomain: "identity/workplaces",
    canReport: true,
    canHide: false,
    canDeactivate: false,
    canRestore: false,
    publicPreviewStatus: "partial",
    routeTargetBuilderId: "workplace",
  },
  {
    targetType: "workplace_post",
    sourceDomain: "content-v2/workplace-posts",
    canReport: true,
    canHide: true,
    canDeactivate: true,
    canRestore: false,
    publicPreviewStatus: "partial",
    routeTargetBuilderId: "workplace_post",
  },
  {
    targetType: "important_event",
    sourceDomain: "events-v2",
    canReport: true,
    canHide: false,
    canDeactivate: false,
    canRestore: false,
    publicPreviewStatus: "planned",
    routeTargetBuilderId: "important_event",
  },
  {
    targetType: "profile_presentation_item",
    sourceDomain: "identity",
    canReport: true,
    canHide: false,
    canDeactivate: false,
    canRestore: false,
    publicPreviewStatus: "planned",
    routeTargetBuilderId: "profile_presentation_item",
  },
  {
    targetType: "media_asset",
    sourceDomain: "media",
    canReport: true,
    canHide: false,
    canDeactivate: true,
    canRestore: false,
    publicPreviewStatus: "partial",
    routeTargetBuilderId: "media_asset",
  },
  {
    targetType: "module_item",
    sourceDomain: "modules",
    canReport: true,
    canHide: false,
    canDeactivate: false,
    canRestore: false,
    publicPreviewStatus: "planned",
    routeTargetBuilderId: "module_item",
  },
] as const;

/** Returns the reason definition for the given key (or null). */
export function findReportReasonDefinition(
  key: string,
): ModerationReportReasonDefinition | null {
  return (
    MODERATION_REPORT_REASON_DEFINITIONS.find((row) => row.key === key) ?? null
  );
}

/** Returns the target definition for the given target type (or null). */
export function findTargetDefinition(
  targetType: string,
): ModerationTargetDefinition | null {
  return (
    MODERATION_TARGET_DEFINITIONS.find((row) => row.targetType === targetType) ??
    null
  );
}

export function isKnownReportReason(value: string): value is ModerationReportReason {
  return MODERATION_REPORT_REASONS.includes(value as ModerationReportReason);
}

export function isKnownTargetType(value: string): value is ModerationTargetType {
  return MODERATION_TARGET_TYPES.includes(value as ModerationTargetType);
}
