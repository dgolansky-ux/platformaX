/**
 * events-v2 — pure validation policy. No side effects.
 */
import {
  EVENT_DESCRIPTION_MAX,
  EVENT_LOCATION_MAX,
  EVENT_TITLE_MAX,
  type EventLocationType,
  type EventVisibility,
} from "./dto";

export type EventValidationError =
  | "TITLE_REQUIRED"
  | "TITLE_TOO_LONG"
  | "DESCRIPTION_TOO_LONG"
  | "START_AT_INVALID"
  | "END_AT_INVALID"
  | "END_BEFORE_START"
  | "LOCATION_INVALID"
  | "LOCATION_TOO_LONG"
  | "VISIBILITY_INVALID";

const VISIBILITIES: readonly EventVisibility[] = ["public", "private", "members_only"];
const LOCATION_TYPES: readonly EventLocationType[] = ["online", "offline", "hybrid"];

export function isEventVisibility(v: string): v is EventVisibility {
  return (VISIBILITIES as readonly string[]).includes(v);
}

export function isEventLocationType(v: string): v is EventLocationType {
  return (LOCATION_TYPES as readonly string[]).includes(v);
}

function parseDate(s: string): Date | null {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function validateEventTitle(title: string): EventValidationError | null {
  const trimmed = title.trim();
  if (trimmed.length === 0) return "TITLE_REQUIRED";
  if (trimmed.length > EVENT_TITLE_MAX) return "TITLE_TOO_LONG";
  return null;
}

export function validateEventDescription(description: string): EventValidationError | null {
  if (description.length > EVENT_DESCRIPTION_MAX) return "DESCRIPTION_TOO_LONG";
  return null;
}

export function validateEventDates(
  startAt: string,
  endAt: string | null | undefined,
): EventValidationError | null {
  const start = parseDate(startAt);
  if (!start) return "START_AT_INVALID";
  if (endAt !== null && endAt !== undefined && endAt !== "") {
    const end = parseDate(endAt);
    if (!end) return "END_AT_INVALID";
    if (end.getTime() < start.getTime()) return "END_BEFORE_START";
  }
  return null;
}

export function validateEventLocation(
  locationType: EventLocationType,
  locationText: string | null | undefined,
): EventValidationError | null {
  if (locationType === "offline" || locationType === "hybrid") {
    if (!locationText || locationText.trim().length === 0) return "LOCATION_INVALID";
  }
  if (locationText && locationText.length > EVENT_LOCATION_MAX) return "LOCATION_TOO_LONG";
  return null;
}
