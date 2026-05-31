/**
 * identity/workplaces — pure policy + validation. No IO, no PII logs.
 */
import {
  WORKPLACE_DESCRIPTION_MAX,
  WORKPLACE_HEADLINE_MAX,
  WORKPLACE_LOCATION_MAX,
  WORKPLACE_NAME_MAX,
  WORKPLACE_SLUG_MAX,
  WORKPLACE_SPECIALIZATIONS_MAX,
  type WorkplaceContactVisibility,
  type WorkplaceRecord,
  type WorkplaceVisibility,
} from "./dto";
import type {
  WorkplaceContactAccessVerdict,
  WorkplaceContactRule,
} from "./contracts";

export type WorkplaceValidationError =
  | "NAME_REQUIRED"
  | "NAME_TOO_LONG"
  | "SLUG_REQUIRED"
  | "SLUG_INVALID"
  | "SLUG_TOO_LONG"
  | "HEADLINE_TOO_LONG"
  | "DESCRIPTION_TOO_LONG"
  | "LOCATION_TOO_LONG"
  | "SPECIALIZATIONS_TOO_MANY"
  | "WEBSITE_URL_INVALID"
  | "WEBSITE_URL_UNSAFE"
  | "CONTACT_VISIBILITY_INVALID"
  | "VISIBILITY_INVALID";

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const UNSAFE_URL_SCHEMES = ["javascript:", "data:", "file:", "vbscript:"];

const VISIBILITIES: readonly WorkplaceVisibility[] = ["public", "friends_only", "private"];
const CONTACT_VISIBILITIES: readonly WorkplaceContactVisibility[] = [
  "owner_only",
  "friends",
  "approved_contact_fields",
  "public",
];

export function isWorkplaceVisibility(v: string): v is WorkplaceVisibility {
  return (VISIBILITIES as readonly string[]).includes(v);
}

export function isWorkplaceContactVisibility(v: string): v is WorkplaceContactVisibility {
  return (CONTACT_VISIBILITIES as readonly string[]).includes(v);
}

export function normalizeSlug(input: string): string {
  return input.trim().toLowerCase();
}

export function validateSlug(slug: string): WorkplaceValidationError | null {
  const s = slug.trim();
  if (s.length === 0) return "SLUG_REQUIRED";
  if (s.length > WORKPLACE_SLUG_MAX) return "SLUG_TOO_LONG";
  if (!SLUG_PATTERN.test(s)) return "SLUG_INVALID";
  return null;
}

export function validateName(name: string): WorkplaceValidationError | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "NAME_REQUIRED";
  if (trimmed.length > WORKPLACE_NAME_MAX) return "NAME_TOO_LONG";
  return null;
}

export function validateHeadline(headline: string): WorkplaceValidationError | null {
  if (headline.length > WORKPLACE_HEADLINE_MAX) return "HEADLINE_TOO_LONG";
  return null;
}

export function validateDescription(description: string): WorkplaceValidationError | null {
  if (description.length > WORKPLACE_DESCRIPTION_MAX) return "DESCRIPTION_TOO_LONG";
  return null;
}

export function validateLocation(location: string | null | undefined): WorkplaceValidationError | null {
  if (!location) return null;
  if (location.length > WORKPLACE_LOCATION_MAX) return "LOCATION_TOO_LONG";
  return null;
}

export function validateSpecializations(
  slugs: readonly string[] | undefined,
): WorkplaceValidationError | null {
  if (!slugs) return null;
  if (slugs.length > WORKPLACE_SPECIALIZATIONS_MAX) return "SPECIALIZATIONS_TOO_MANY";
  return null;
}

/**
 * Validates the website URL. Returns null when null/empty or safe https://.
 * Rejects javascript:/data:/file:/vbscript: schemes and malformed URLs.
 */
export function validateWebsiteUrl(url: string | null | undefined): WorkplaceValidationError | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.length === 0) return null;
  const lower = trimmed.toLowerCase();
  if (UNSAFE_URL_SCHEMES.some((s) => lower.startsWith(s))) return "WEBSITE_URL_UNSAFE";
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "WEBSITE_URL_UNSAFE";
  } catch {
    return "WEBSITE_URL_INVALID";
  }
  return null;
}

export function canViewWorkplace(
  record: Pick<WorkplaceRecord, "ownerUserId" | "visibility" | "status">,
  viewerUserId: string,
  isFriend: boolean,
): boolean {
  if (record.status === "draft") return record.ownerUserId === viewerUserId;
  if (record.ownerUserId === viewerUserId) return true;
  if (record.visibility === "public") return true;
  if (record.visibility === "friends_only") return isFriend;
  return false;
}

export function canEditWorkplace(
  record: Pick<WorkplaceRecord, "ownerUserId">,
  actorUserId: string,
): boolean {
  return record.ownerUserId === actorUserId;
}

/**
 * Contact projection rule — given the workplace's contactVisibility and the
 * viewer's verdict, decides whether contact email/phone may be exposed.
 */
export function canViewContact(rule: WorkplaceContactRule): boolean {
  if (rule.verdict === "owner") return true;
  switch (rule.visibility) {
    case "public":
      return true;
    case "friends":
      return rule.verdict === "friend";
    case "approved_contact_fields":
      return rule.verdict === "approved_contact_fields" || rule.verdict === "friend";
    case "owner_only":
      return false;
    default: {
      const _exhaustive: never = rule.visibility;
      void _exhaustive;
      return false;
    }
  }
}

export function describeContactVerdict(verdict: WorkplaceContactAccessVerdict): string {
  switch (verdict) {
    case "owner":
      return "Jesteś właścicielem.";
    case "friend":
      return "Jesteście znajomymi.";
    case "approved_contact_fields":
      return "Masz zgodę kontaktową od właściciela.";
    case "stranger":
      return "Brak relacji.";
    default: {
      const _exhaustive: never = verdict;
      void _exhaustive;
      return "Brak relacji.";
    }
  }
}
