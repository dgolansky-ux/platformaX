/**
 * events-v2 — mapper. Internal DTO → public projection. No createdBy leak.
 */
import type { EventDTO, EventPublicDTO } from "./dto";

export function toEventPublic(event: EventDTO): EventPublicDTO {
  return {
    id: event.id,
    ownerType: event.ownerType,
    ownerId: event.ownerId,
    title: event.title,
    description: event.description,
    startAt: event.startAt,
    endAt: event.endAt,
    locationType: event.locationType,
    locationText: event.locationText,
    visibility: event.visibility,
    status: event.status,
    updatedAt: event.updatedAt,
  };
}
