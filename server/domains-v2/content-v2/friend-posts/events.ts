/**
 * content-v2/friend-posts — domain event skeletons.
 *
 * Event hooks for future notifications. NO notifications UI is wired this
 * slice. Payloads carry user ids and post/comment ids only — no PII.
 *
 * If an outbox/event bus is added later, these payloads can be emitted from
 * the service. The service currently builds them but does not publish.
 */

export interface FriendFeedPostCreatedEvent {
  type: "FriendFeedPostCreated";
  eventId: string;
  actorUserId: string;
  authorUserId: string;
  postId: string;
  occurredAt: string;
  correlationId: string | null;
}

export interface FriendFeedCommentCreatedEvent {
  type: "FriendFeedCommentCreated";
  eventId: string;
  actorUserId: string;
  authorUserId: string;
  postId: string;
  commentId: string;
  occurredAt: string;
  correlationId: string | null;
}

export interface FriendFeedReactionAddedEvent {
  type: "FriendFeedReactionAdded";
  eventId: string;
  actorUserId: string;
  authorUserId: string;
  postId: string;
  reactionType: "like";
  occurredAt: string;
  correlationId: string | null;
}

export type FriendFeedDomainEvent =
  | FriendFeedPostCreatedEvent
  | FriendFeedCommentCreatedEvent
  | FriendFeedReactionAddedEvent;

export interface FriendFeedEventPublisher {
  publish(event: FriendFeedDomainEvent): Promise<void> | void;
}

/** No-op publisher used when notifications aren't wired (OUTBOX_SKELETON). */
export function createNoopFriendFeedEventPublisher(): FriendFeedEventPublisher {
  return {
    publish: () => {
      /* OUTBOX_SKELETON — no delivery wired in Slice 11. */
    },
  };
}
