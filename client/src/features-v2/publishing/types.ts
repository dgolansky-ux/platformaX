/**
 * features-v2/publishing — UI types. Mirror the application-v2 publishing
 * contracts; the frontend never imports `@server/*`.
 */

export type PublishingTargetTypeUi =
  | "friend_feed"
  | "community_feed"
  | "community_staff_feed"
  | "community_relational_feed"
  | "channel"
  | "workplace"
  | "important_event"
  | "profile_presentation";

export type PublishingTargetStatusUi = "available" | "disabled" | "partial" | "blocked";

export type PublishingBlockedReasonUi =
  | "permission_denied"
  | "feed_disabled_for_community"
  | "quota_exceeded_relational"
  | "channel_not_a_lead"
  | "workplace_not_owner"
  | "profile_not_owner"
  | "backend_not_ready_v2"
  | "media_runtime_partial";

export type PublishingVisibilityUi =
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

export type PublishingContentTypeUi =
  | "text_post"
  | "media_post"
  | "workplace_update"
  | "important_event"
  | "profile_presentation_item"
  | "channel_post"
  | "community_post";

export type PublishingMediaTypeUi = "image" | "video" | "document" | "link";

export interface PublishingMediaRefUi {
  refId: string;
  mediaType: PublishingMediaTypeUi;
}

export interface PublishingTargetDefinitionUi {
  targetType: PublishingTargetTypeUi;
  targetId: string | null;
  label: string;
  description: string;
  allowedContentTypes: readonly PublishingContentTypeUi[];
  allowedMediaTypes: readonly PublishingMediaTypeUi[];
  visibilityOptions: readonly PublishingVisibilityUi[];
  defaultVisibility: PublishingVisibilityUi;
  maxBodyLength: number;
  maxMediaCount: number;
  permissionsRequired: readonly string[];
  status: PublishingTargetStatusUi;
  blockedReason?: PublishingBlockedReasonUi;
  routeTarget?: string;
}

export interface PublishingCommandUi {
  targetType: PublishingTargetTypeUi;
  targetId?: string;
  contentType: PublishingContentTypeUi;
  body: string;
  title?: string;
  date?: string;
  mediaRefs?: readonly PublishingMediaRefUi[];
  visibility: PublishingVisibilityUi;
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
  idempotencyKey: string;
  clientRequestId?: string;
}

export type PublishingResultStatusUi = "published" | "draft_saved" | "partial" | "blocked";

export type PublishingErrorCodeUi =
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

export interface PublishingErrorUi {
  code: PublishingErrorCodeUi;
  message: string;
}

export interface PublishingResultUi {
  status: PublishingResultStatusUi;
  publishedEntity: {
    domain: string;
    entityType: string;
    entityId: string;
    routeTarget: string;
  } | null;
  feedEffects: {
    createdFriendFeedItem: boolean;
    createdTeaser: boolean;
    createdNotificationEvent: boolean;
    noFeedEffect: boolean;
  };
  warnings: readonly string[];
  errors: readonly PublishingErrorUi[];
}

export interface PublishingPreviewUi {
  targetType: PublishingTargetTypeUi;
  targetId: string | null;
  targetLabel: string;
  contentPreview: string;
  mediaPreviewRefs: readonly PublishingMediaRefUi[];
  visibilityLabel: string;
  expectedDestinations: readonly string[];
  warnings: readonly string[];
  disabledReason?: PublishingBlockedReasonUi;
}

export interface PublishingAdapter {
  listAvailableTargets(viewerUserId: string): Promise<readonly PublishingTargetDefinitionUi[]>;
  buildPreview(viewerUserId: string, command: PublishingCommandUi): Promise<PublishingPreviewUi>;
  publish(viewerUserId: string, command: PublishingCommandUi): Promise<PublishingResultUi>;
}
