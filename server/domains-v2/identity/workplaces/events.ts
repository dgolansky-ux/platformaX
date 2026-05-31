/**
 * identity/workplaces — domain event skeletons (OUTBOX_SKELETON).
 *
 * Payloads carry ids only — no PII, no contact data.
 */

export interface WorkplaceCreatedEvent {
  type: "WorkplaceCreated";
  eventId: string;
  workplaceId: string;
  ownerUserId: string;
  ownerProfileId: string;
  occurredAt: string;
  correlationId: string | null;
}

export interface WorkplaceArchivedEvent {
  type: "WorkplaceArchived";
  eventId: string;
  workplaceId: string;
  ownerUserId: string;
  occurredAt: string;
  correlationId: string | null;
}

export type WorkplaceDomainEvent = WorkplaceCreatedEvent | WorkplaceArchivedEvent;

export interface WorkplaceEventPublisher {
  publish(event: WorkplaceDomainEvent): Promise<void> | void;
}

export function createNoopWorkplaceEventPublisher(): WorkplaceEventPublisher {
  return {
    publish: () => {
      /* OUTBOX_SKELETON — no delivery wired in Slice 12. */
    },
  };
}
