/**
 * application-v2/use-cases/publishing — unified publishing contracts (Slice 17).
 *
 * Shared command / preview / result envelope for every publishing target
 * (friend feed, community feeds, channel, workplace, important event, profile
 * presentation). The dispatcher in `service.ts` routes a `PublishingCommand`
 * to the matching per-target use-case — there is NO god-service that owns
 * the publishing logic itself. All persistence stays inside the domain that
 * owns the record (content-v2 / workplace-posts / channel-posts / …).
 *
 * No PII passes through these envelopes:
 *   - bodies and titles are user-authored text the user is publishing;
 *   - media is referenced by ID only (no base64);
 *   - author / target identifiers are opaque user/community/channel ids.
 */

export type PublishingTargetType =
  | "friend_feed"
  | "community_feed"
  | "community_staff_feed"
  | "community_relational_feed"
  | "channel"
  | "workplace"
  | "important_event"
  | "profile_presentation";

export type PublishingContentType =
  | "text_post"
  | "media_post"
  | "workplace_update"
  | "important_event"
  | "profile_presentation_item"
  | "channel_post"
  | "community_post";

export type PublishingVisibility =
  | "friends_only"
  | "public"
  | "private"
  | "community_all"
  | "community_staff"
  | "community_relational"
  | "channel_followers"
  | "workplace_public"
  | "workplace_friends_only"
  | "workplace_private"
  | "profile_owner_chosen";

export type PublishingTargetStatus =
  | "available"
  | "disabled"
  | "partial"
  | "blocked";

export type PublishingTargetOwnerType =
  | "user"
  | "profile"
  | "community"
  | "channel"
  | "workplace";

/**
 * One row of the Target Publishing Registry. Returned by
 * `getAvailablePublishingTargets` together with viewer-specific status and
 * the truthful reason why a target may be disabled. This is a *declarative*
 * description used by the UI's `TargetSelector` — it never performs the
 * publish itself.
 */
export interface PublishingTargetDefinition {
  readonly targetType: PublishingTargetType;
  readonly targetId: string | null;
  readonly ownerType: PublishingTargetOwnerType;
  readonly label: string;
  readonly description: string;
  readonly allowedContentTypes: readonly PublishingContentType[];
  readonly allowedMediaTypes: readonly PublishingMediaType[];
  readonly visibilityOptions: readonly PublishingVisibility[];
  readonly defaultVisibility: PublishingVisibility;
  readonly maxBodyLength: number;
  readonly maxMediaCount: number;
  readonly permissionsRequired: readonly string[];
  readonly status: PublishingTargetStatus;
  readonly blockedReason?: PublishingBlockedReason;
  readonly routeTarget?: string;
}

export type PublishingBlockedReason =
  | "permission_denied"
  | "feed_disabled_for_community"
  | "quota_exceeded_relational"
  | "channel_not_a_lead"
  | "workplace_not_owner"
  | "profile_not_owner"
  | "backend_not_ready_v2"
  | "media_runtime_partial";

export type PublishingMediaType = "image" | "video" | "document" | "link";

export interface PublishingMediaRef {
  readonly refId: string;
  readonly mediaType: PublishingMediaType;
}

export interface PublishingCommand {
  readonly targetType: PublishingTargetType;
  /** Required when targetType is community_*, channel, workplace, or profile-scoped. */
  readonly targetId?: string;
  readonly contentType: PublishingContentType;
  readonly body: string;
  readonly title?: string;
  /** ISO-8601 instant — required for `important_event`, optional elsewhere. */
  readonly date?: string;
  readonly mediaRefs?: readonly PublishingMediaRef[];
  readonly visibility: PublishingVisibility;
  readonly metadata?: Readonly<Record<string, string | number | boolean | null>>;
  /** Opaque per-attempt idempotency key the client sets when starting a publish. */
  readonly idempotencyKey: string;
  readonly clientRequestId?: string;
}

export type PublishingResultStatus =
  | "published"
  | "draft_saved"
  | "partial"
  | "blocked";

export interface PublishingFeedEffects {
  readonly createdFriendFeedItem: boolean;
  readonly createdTeaser: boolean;
  readonly createdNotificationEvent: boolean;
  readonly noFeedEffect: boolean;
}

export interface PublishedEntityRef {
  readonly domain: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly routeTarget: string;
}

export type PublishingErrorCode =
  | "EMPTY_BODY"
  | "TITLE_REQUIRED"
  | "DATE_REQUIRED"
  | "TARGET_NOT_ALLOWED"
  | "VISIBILITY_NOT_ALLOWED"
  | "MEDIA_TOO_MANY"
  | "MEDIA_TYPE_NOT_ALLOWED"
  | "TARGET_PARTIAL"
  | "TRANSPORT_PARTIAL"
  | "PERMISSION_DENIED"
  | "RATE_LIMITED"
  | "QUOTA_EXCEEDED"
  | "TARGET_NOT_FOUND"
  | "UNSUPPORTED_TARGET"
  | "INTERNAL_ERROR";

export interface PublishingError {
  readonly code: PublishingErrorCode;
  readonly message: string;
}

export interface PublishingResult {
  readonly status: PublishingResultStatus;
  readonly publishedEntity: PublishedEntityRef | null;
  readonly feedEffects: PublishingFeedEffects;
  readonly warnings: readonly string[];
  readonly errors: readonly PublishingError[];
}

export interface PublishingPreview {
  readonly targetType: PublishingTargetType;
  readonly targetId: string | null;
  readonly targetLabel: string;
  readonly contentPreview: string;
  readonly mediaPreviewRefs: readonly PublishingMediaRef[];
  readonly visibilityLabel: string;
  readonly expectedDestinations: readonly string[];
  readonly warnings: readonly string[];
  readonly disabledReason?: PublishingBlockedReason;
}

/**
 * Server-side viewer/context envelope passed to every publishing call.
 * Use-cases NEVER read the viewer from any other place — they only trust
 * what this context says.
 */
export interface PublishingRequestContext {
  readonly viewerUserId: string;
  /** Server clock for idempotency / time-windowed quotas. */
  readonly now: () => Date;
}

/** Per-target body/media limits — used by both registry and validators. */
export const PUBLISHING_LIMITS = {
  friend_feed: { maxBodyLength: 4000, maxMediaCount: 4 },
  community_feed: { maxBodyLength: 6000, maxMediaCount: 6 },
  community_staff_feed: { maxBodyLength: 6000, maxMediaCount: 6 },
  community_relational_feed: { maxBodyLength: 6000, maxMediaCount: 6 },
  channel: { maxBodyLength: 8000, maxMediaCount: 8 },
  workplace: { maxBodyLength: 6000, maxMediaCount: 6 },
  important_event: { maxBodyLength: 4000, maxMediaCount: 4 },
  profile_presentation: { maxBodyLength: 6000, maxMediaCount: 6 },
} as const satisfies Record<PublishingTargetType, { maxBodyLength: number; maxMediaCount: number }>;

export function buildEmptyFeedEffects(overrides?: Partial<PublishingFeedEffects>): PublishingFeedEffects {
  return {
    createdFriendFeedItem: false,
    createdTeaser: false,
    createdNotificationEvent: false,
    noFeedEffect: false,
    ...overrides,
  };
}

export function blockedResult(reason: PublishingBlockedReason, message: string): PublishingResult {
  return {
    status: "blocked",
    publishedEntity: null,
    feedEffects: buildEmptyFeedEffects({ noFeedEffect: true }),
    warnings: [],
    errors: [{ code: blockedReasonToErrorCode(reason), message }],
  };
}

export function partialResult(message: string): PublishingResult {
  return {
    status: "partial",
    publishedEntity: null,
    feedEffects: buildEmptyFeedEffects({ noFeedEffect: true }),
    warnings: [message],
    errors: [],
  };
}

function blockedReasonToErrorCode(reason: PublishingBlockedReason): PublishingErrorCode {
  switch (reason) {
    case "permission_denied":
    case "channel_not_a_lead":
    case "workplace_not_owner":
    case "profile_not_owner":
      return "PERMISSION_DENIED";
    case "feed_disabled_for_community":
      return "TARGET_NOT_ALLOWED";
    case "quota_exceeded_relational":
      return "QUOTA_EXCEEDED";
    case "backend_not_ready_v2":
      return "TARGET_PARTIAL";
    case "media_runtime_partial":
      return "TRANSPORT_PARTIAL";
  }
}
