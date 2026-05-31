/**
 * content-v2/workplace-teasers — domain events (OUTBOX_SKELETON).
 */

export interface FriendFeedWorkplaceTeaserCreatedEvent {
  type: "FriendFeedWorkplaceTeaserCreated";
  eventId: string;
  teaserId: string;
  workplaceId: string;
  sourcePostId: string;
  ownerUserId: string;
  visibility: "friends_only" | "public";
  occurredAt: string;
  correlationId: string | null;
}

export type WorkplaceTeaserDomainEvent = FriendFeedWorkplaceTeaserCreatedEvent;

export interface WorkplaceTeaserEventPublisher {
  publish(event: WorkplaceTeaserDomainEvent): Promise<void> | void;
}

export function createNoopWorkplaceTeaserEventPublisher(): WorkplaceTeaserEventPublisher {
  return {
    publish: () => {
      /* OUTBOX_SKELETON — no delivery wired in Slice 12. */
    },
  };
}
