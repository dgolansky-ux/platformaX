/**
 * events-v2 — service. FOUNDATION_READY (in-memory store, no transport).
 *
 * Owns event CRUD only. Module enablement gating is enforced when surfacing
 * public views.
 */
import type {
  CreateEventInput,
  EventDTO,
  EventLocationType,
  EventOwnerType,
  EventPublicDTO,
  EventVisibility,
  UpdateEventInput,
} from "./dto";
import { toEventPublic } from "./mapper";
import {
  isEventLocationType,
  isEventVisibility,
  validateEventDates,
  validateEventDescription,
  validateEventLocation,
  validateEventTitle,
} from "./policy";
import type {
  EventModuleEnablementResolver,
  EventOwnershipResolver,
} from "./contracts";
import type { EventRepository } from "./store";

export type EventsClock = { now: () => Date };
export type EventsIdGen = { next: () => string };

export type EventsServiceDeps = {
  events: EventRepository;
  ownership: EventOwnershipResolver;
  moduleEnablement: EventModuleEnablementResolver;
  clock: EventsClock;
  ids: EventsIdGen;
};

export type EventsErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "MODULE_NOT_ENABLED"
  | "VALIDATION_FAILED";

export type EventsResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: EventsErrorCode; message: string } };

export interface EventsService {
  createEvent(input: CreateEventInput): Promise<EventsResult<EventDTO>>;
  updateEvent(input: UpdateEventInput): Promise<EventsResult<EventDTO>>;
  cancelEvent(input: { eventId: string; actorUserId: string }): Promise<EventsResult<EventDTO>>;
  listEventsForOwner(ownerType: EventOwnerType, ownerId: string): Promise<EventPublicDTO[]>;
  getEventPublicView(eventId: string): Promise<EventsResult<EventPublicDTO>>;
}

type Deps = EventsServiceDeps;

function fail<T>(code: EventsErrorCode, message: string): EventsResult<T> {
  return { ok: false, error: { code, message } };
}

function validateCreate(input: CreateEventInput) {
  const t = validateEventTitle(input.title);
  if (t) return t;
  const d = validateEventDescription(input.description);
  if (d) return d;
  if (!isEventLocationType(input.locationType)) return "LOCATION_INVALID";
  const l = validateEventLocation(input.locationType, input.locationText ?? null);
  if (l) return l;
  if (!isEventVisibility(input.visibility)) return "VISIBILITY_INVALID";
  const dates = validateEventDates(input.startAt, input.endAt ?? null);
  if (dates) return dates;
  return null;
}

async function createEvent(deps: Deps, input: CreateEventInput): Promise<EventsResult<EventDTO>> {
  const can = await deps.ownership.canManageEventsForOwner(
    input.createdByUserId,
    input.ownerType,
    input.ownerId,
  );
  if (!can) return fail("FORBIDDEN", "Actor cannot create events for this owner.");
  const vErr = validateCreate(input);
  if (vErr) return fail("VALIDATION_FAILED", vErr);
  const now = deps.clock.now().toISOString();
  const event: EventDTO = {
    id: deps.ids.next(),
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    title: input.title.trim(),
    description: input.description,
    startAt: input.startAt,
    endAt: input.endAt ?? null,
    locationType: input.locationType,
    locationText: input.locationText ?? null,
    visibility: input.visibility,
    status: "published",
    createdByUserId: input.createdByUserId,
    createdAt: now,
    updatedAt: now,
  };
  await deps.events.insert(event);
  return { ok: true, value: event };
}

type UpdatePatch = {
  title: string;
  description: string;
  visibility: EventVisibility;
  locationType: EventLocationType;
  locationText: string | null;
  startAt: string;
  endAt: string | null;
};

function applyUpdate(existing: EventDTO, input: UpdateEventInput): EventsResult<UpdatePatch> {
  let title = existing.title;
  if (input.title !== undefined) {
    const e = validateEventTitle(input.title);
    if (e) return fail("VALIDATION_FAILED", e);
    title = input.title.trim();
  }
  let description = existing.description;
  if (input.description !== undefined) {
    const e = validateEventDescription(input.description);
    if (e) return fail("VALIDATION_FAILED", e);
    description = input.description;
  }
  let visibility: EventVisibility = existing.visibility;
  if (input.visibility !== undefined) {
    if (!isEventVisibility(input.visibility)) return fail("VALIDATION_FAILED", "VISIBILITY_INVALID");
    visibility = input.visibility;
  }
  let locationType: EventLocationType = existing.locationType;
  if (input.locationType !== undefined) {
    if (!isEventLocationType(input.locationType)) return fail("VALIDATION_FAILED", "LOCATION_INVALID");
    locationType = input.locationType;
  }
  let locationText: string | null = existing.locationText;
  if (input.locationText !== undefined) locationText = input.locationText;
  const locErr = validateEventLocation(locationType, locationText);
  if (locErr) return fail("VALIDATION_FAILED", locErr);
  let startAt = existing.startAt;
  let endAt: string | null = existing.endAt;
  if (input.startAt !== undefined) startAt = input.startAt;
  if (input.endAt !== undefined) endAt = input.endAt;
  const dateErr = validateEventDates(startAt, endAt);
  if (dateErr) return fail("VALIDATION_FAILED", dateErr);
  return { ok: true, value: { title, description, visibility, locationType, locationText, startAt, endAt } };
}

async function updateEvent(deps: Deps, input: UpdateEventInput): Promise<EventsResult<EventDTO>> {
  const existing = await deps.events.getById(input.eventId);
  if (!existing) return fail("NOT_FOUND", "Event not found.");
  const can = await deps.ownership.canManageEventsForOwner(
    input.actorUserId,
    existing.ownerType,
    existing.ownerId,
  );
  if (!can) return fail("FORBIDDEN", "Actor cannot manage this event.");
  const patch = applyUpdate(existing, input);
  if (!patch.ok) return patch;
  const updated: EventDTO = {
    ...existing,
    ...patch.value,
    updatedAt: deps.clock.now().toISOString(),
  };
  await deps.events.update(updated);
  return { ok: true, value: updated };
}

async function cancelEvent(
  deps: Deps,
  args: { eventId: string; actorUserId: string },
): Promise<EventsResult<EventDTO>> {
  const existing = await deps.events.getById(args.eventId);
  if (!existing) return fail("NOT_FOUND", "Event not found.");
  const can = await deps.ownership.canManageEventsForOwner(
    args.actorUserId,
    existing.ownerType,
    existing.ownerId,
  );
  if (!can) return fail("FORBIDDEN", "Actor cannot cancel this event.");
  const updated: EventDTO = {
    ...existing,
    status: "cancelled",
    updatedAt: deps.clock.now().toISOString(),
  };
  await deps.events.update(updated);
  return { ok: true, value: updated };
}

async function listEventsForOwner(
  deps: Deps,
  ownerType: EventOwnerType,
  ownerId: string,
): Promise<EventPublicDTO[]> {
  const enabled = await deps.moduleEnablement.isEventsEnabled(ownerType, ownerId);
  if (!enabled) return [];
  const events = await deps.events.listForOwner(ownerType, ownerId);
  return events
    .filter((e) => e.status !== "cancelled" && e.visibility === "public")
    .map(toEventPublic);
}

async function getEventPublicView(deps: Deps, eventId: string): Promise<EventsResult<EventPublicDTO>> {
  const event = await deps.events.getById(eventId);
  if (!event) return fail("NOT_FOUND", "Event not found.");
  const enabled = await deps.moduleEnablement.isEventsEnabled(event.ownerType, event.ownerId);
  if (!enabled) return fail("MODULE_NOT_ENABLED", "Events module disabled for owner.");
  if (event.visibility !== "public") return fail("NOT_FOUND", "Event not public.");
  return { ok: true, value: toEventPublic(event) };
}

export function createEventsService(deps: EventsServiceDeps): EventsService {
  return {
    createEvent: (input) => createEvent(deps, input),
    updateEvent: (input) => updateEvent(deps, input),
    cancelEvent: (args) => cancelEvent(deps, args),
    listEventsForOwner: (ownerType, ownerId) => listEventsForOwner(deps, ownerType, ownerId),
    getEventPublicView: (eventId) => getEventPublicView(deps, eventId),
  };
}
