/**
 * content-v2/workplace-posts — domain events (OUTBOX_SKELETON).
 */

export interface WorkplacePostCreatedEvent {
  type: "WorkplacePostCreated";
  eventId: string;
  workplaceId: string;
  postId: string;
  authorUserId: string;
  postType: string;
  visibility: string;
  occurredAt: string;
  correlationId: string | null;
}

export type WorkplacePostDomainEvent = WorkplacePostCreatedEvent;

export interface WorkplacePostEventPublisher {
  publish(event: WorkplacePostDomainEvent): Promise<void> | void;
}

export function createNoopWorkplacePostEventPublisher(): WorkplacePostEventPublisher {
  return {
    publish: () => {
      /* OUTBOX_SKELETON — no delivery wired in Slice 12. */
    },
  };
}
