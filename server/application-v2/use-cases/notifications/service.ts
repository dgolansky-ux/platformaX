/**
 * application-v2/use-cases/notifications — event → notification orchestration.
 *
 * Subscribes the friend-feed domain events (the events that exist today) to
 * the notifications-v2 service. All other product events from the event
 * registry are blocked_by_missing_source_event — handlers stay typed but
 * fenced behind a guard so we never silently miss them once their source
 * domain begins emitting.
 *
 * No domain internals are imported — only public-api modules.
 *
 * Mapping rules:
 *   - actor === recipient → notifications-v2 short-circuits to skipped
 *   - dedupeKey is the upstream eventId, so retries are idempotent
 *   - settings check is delegated to notifications-v2 (it owns category gate)
 *   - title / bodyPreview is PII-free (no email/phone/raw post body)
 */
import type {
  FriendFeedCommentCreatedEvent,
  FriendFeedCommentReactionAddedEvent,
  FriendFeedReactionAddedEvent,
} from "@server/domains-v2/content-v2/public-api";
import type {
  CreateNotificationOutcome,
  NotificationsResult,
  NotificationsService,
} from "@server/domains-v2/notifications-v2/public-api";

export interface NotificationOrchestratorDeps {
  notifications: NotificationsService;
}

export type NotificationHandlerResult = NotificationsResult<CreateNotificationOutcome>;

const FRIEND_FEED_TITLE_COMMENT = "Nowy komentarz pod Twoim wpisem";
const FRIEND_FEED_TITLE_REACTION = "Ktoś polubił Twój wpis";
const FRIEND_FEED_TITLE_COMMENT_REACTION = "Ktoś polubił Twój komentarz";

const FRIEND_FEED_BODY_COMMENT = "Sprawdź, co ma do powiedzenia.";
const FRIEND_FEED_BODY_REACTION = "Twój wpis ma nową reakcję.";
const FRIEND_FEED_BODY_COMMENT_REACTION = "Twój komentarz zebrał reakcję.";

function friendFeedRoute(postId: string, anchor?: string): string {
  return anchor ? `/friends-feed?postId=${postId}#${anchor}` : `/friends-feed?postId=${postId}`;
}

export interface NotificationOrchestrator {
  handleFriendFeedCommentCreated(event: FriendFeedCommentCreatedEvent): Promise<NotificationHandlerResult>;
  handleFriendFeedReactionAdded(event: FriendFeedReactionAddedEvent): Promise<NotificationHandlerResult>;
  handleFriendFeedCommentReactionAdded(event: FriendFeedCommentReactionAddedEvent): Promise<NotificationHandlerResult>;
}

export function createNotificationOrchestrator(deps: NotificationOrchestratorDeps): NotificationOrchestrator {
  const { notifications } = deps;

  return {
    async handleFriendFeedCommentCreated(event) {
      return notifications.createNotification({
        recipientUserId: event.recipientUserId,
        actorUserId: event.actorUserId,
        type: "friend_post_comment",
        category: "friend_feed",
        title: FRIEND_FEED_TITLE_COMMENT,
        bodyPreview: FRIEND_FEED_BODY_COMMENT,
        source: {
          sourceDomain: "content-v2/friend-posts",
          sourceType: "FriendFeedComment",
          sourceId: event.commentId,
          routeTarget: friendFeedRoute(event.postId, `comment-${event.commentId}`),
        },
        dedupeKey: event.eventId,
        correlationId: event.correlationId,
      });
    },

    async handleFriendFeedReactionAdded(event) {
      return notifications.createNotification({
        recipientUserId: event.recipientUserId,
        actorUserId: event.actorUserId,
        type: "friend_post_reaction",
        category: "friend_feed",
        title: FRIEND_FEED_TITLE_REACTION,
        bodyPreview: FRIEND_FEED_BODY_REACTION,
        source: {
          sourceDomain: "content-v2/friend-posts",
          sourceType: "FriendFeedReaction",
          sourceId: event.postId,
          routeTarget: friendFeedRoute(event.postId),
        },
        dedupeKey: event.eventId,
        correlationId: event.correlationId,
      });
    },

    async handleFriendFeedCommentReactionAdded(event) {
      return notifications.createNotification({
        recipientUserId: event.recipientUserId,
        actorUserId: event.actorUserId,
        type: "friend_post_comment_reaction",
        category: "friend_feed",
        title: FRIEND_FEED_TITLE_COMMENT_REACTION,
        bodyPreview: FRIEND_FEED_BODY_COMMENT_REACTION,
        source: {
          sourceDomain: "content-v2/friend-posts",
          sourceType: "FriendFeedCommentReaction",
          sourceId: event.commentId,
          routeTarget: friendFeedRoute(event.postId, `comment-${event.commentId}`),
        },
        dedupeKey: event.eventId,
        correlationId: event.correlationId,
      });
    },
  };
}
