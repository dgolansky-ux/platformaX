/**
 * moderation — domain events (Slice 20 foundation).
 *
 * Subscribers (notifications-v2 in particular) use the strongly-typed shape
 * here. Event payloads carry IDs only — never PII, never description body.
 *
 * PX-EVENT-001-ACK: moderation emits events in-process via the injected
 * publisher; the transactional outbox + EventEnvelope wrap is scheduled
 * for the runtime backend slice. Tracked in EXCEPTIONS_REGISTER under
 * EXC-016.
 */
import type { UserId } from "@shared/contracts/branded-ids";
import type {
  ModerationActionType,
  ModerationReportReason,
  ModerationReportSeverity,
  ModerationReportStatus,
  ModerationTargetType,
} from "./contracts";

export interface ModerationReportCreatedEvent {
  type: "ModerationReportCreated";
  reportId: string;
  reporterUserId: UserId;
  targetType: ModerationTargetType;
  targetId: string;
  targetOwnerUserId: UserId | null;
  reason: ModerationReportReason;
  severity: ModerationReportSeverity;
  occurredAt: string;
  correlationId: string;
}

export interface ModerationReportReviewedEvent {
  type: "ModerationReportReviewed";
  reportId: string;
  actorModeratorUserId: UserId;
  newStatus: ModerationReportStatus;
  occurredAt: string;
  correlationId: string;
}

export interface ModerationActionTakenEvent {
  type: "ModerationActionTaken";
  reportId: string;
  actionId: string;
  actorModeratorUserId: UserId;
  targetType: ModerationTargetType;
  targetId: string;
  actionType: ModerationActionType;
  occurredAt: string;
  correlationId: string;
}

export type ModerationDomainEvent =
  | ModerationReportCreatedEvent
  | ModerationReportReviewedEvent
  | ModerationActionTakenEvent;

export interface ModerationEventPublisher {
  publish(event: ModerationDomainEvent): Promise<void>;
}

export function createNoopModerationEventPublisher(): ModerationEventPublisher {
  return {
    async publish() {
      /* no-op publisher for tests and the in-memory wiring */
    },
  };
}
