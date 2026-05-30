/**
 * events-v2 — DTOs. Status: FOUNDATION_READY (in-memory).
 *
 * privacy classification: Public DTO — event metadata. No PII. createdBy is a
 * stable user id (reference identifier), not a display identifier.
 */

export type EventOwnerType = "profile" | "community";
export type EventVisibility = "public" | "private" | "members_only";
export type EventStatus = "draft" | "published" | "cancelled";
export type EventLocationType = "online" | "offline" | "hybrid";

export interface EventDTO {
  id: string;
  ownerType: EventOwnerType;
  ownerId: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string | null;
  locationType: EventLocationType;
  locationText: string | null;
  visibility: EventVisibility;
  status: EventStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

/** Already-public projection. No createdBy / no internal fields. */
export interface EventPublicDTO {
  id: string;
  ownerType: EventOwnerType;
  ownerId: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string | null;
  locationType: EventLocationType;
  locationText: string | null;
  visibility: EventVisibility;
  status: EventStatus;
  updatedAt: string;
}

export interface CreateEventInput {
  ownerType: EventOwnerType;
  ownerId: string;
  title: string;
  description: string;
  startAt: string;
  endAt?: string | null;
  locationType: EventLocationType;
  locationText?: string | null;
  visibility: EventVisibility;
  createdByUserId: string;
}

export interface UpdateEventInput {
  eventId: string;
  actorUserId: string;
  title?: string;
  description?: string;
  startAt?: string;
  endAt?: string | null;
  locationType?: EventLocationType;
  locationText?: string | null;
  visibility?: EventVisibility;
}

export const EVENT_TITLE_MAX = 120;
export const EVENT_DESCRIPTION_MAX = 1000;
export const EVENT_LOCATION_MAX = 200;
