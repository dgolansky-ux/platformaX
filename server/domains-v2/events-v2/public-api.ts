/**
 * events-v2 — public API surface (FOUNDATION_READY).
 */
export { createEventsService } from "./service";
export type {
  EventsService,
  EventsServiceDeps,
  EventsResult,
  EventsErrorCode,
  EventsClock,
  EventsIdGen,
} from "./service";
export { createInMemoryEventRepository } from "./store";
export type { EventRepository } from "./store";
export type {
  EventOwnershipResolver,
  EventModuleEnablementResolver,
} from "./contracts";
export type {
  EventDTO,
  EventPublicDTO,
  EventOwnerType,
  EventVisibility,
  EventStatus,
  EventLocationType,
  CreateEventInput,
  UpdateEventInput,
} from "./dto";
export {
  EVENT_TITLE_MAX,
  EVENT_DESCRIPTION_MAX,
  EVENT_LOCATION_MAX,
} from "./dto";
export { isEventVisibility, isEventLocationType } from "./policy";
