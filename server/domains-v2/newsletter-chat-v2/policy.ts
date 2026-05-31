/**
 * newsletter-chat-v2 — pure validation policy.
 */
import {
  NEWSLETTER_LIMITS,
  type NewsletterStatus,
  type NewsletterVisibility,
} from "./dto";

export type NewsletterValidationError =
  | "TITLE_REQUIRED"
  | "TITLE_TOO_LONG"
  | "DESCRIPTION_TOO_LONG"
  | "BODY_REQUIRED"
  | "BODY_TOO_LONG"
  | "VISIBILITY_INVALID"
  | "STATUS_INVALID";

const VISIBILITIES: readonly NewsletterVisibility[] = [
  "public_preview",
  "subscribers_only",
  "members_only",
];
const STATUSES: readonly NewsletterStatus[] = ["active", "paused", "archived"];

export function isNewsletterVisibility(v: string): v is NewsletterVisibility {
  return (VISIBILITIES as readonly string[]).includes(v);
}

export function isNewsletterStatus(v: string): v is NewsletterStatus {
  return (STATUSES as readonly string[]).includes(v);
}

export function validateNewsletterTitle(title: string): NewsletterValidationError | null {
  const t = title.trim();
  if (t.length === 0) return "TITLE_REQUIRED";
  if (t.length > NEWSLETTER_LIMITS.TITLE_MAX) return "TITLE_TOO_LONG";
  return null;
}

export function validateNewsletterDescription(description: string): NewsletterValidationError | null {
  if (description.length > NEWSLETTER_LIMITS.DESCRIPTION_MAX) return "DESCRIPTION_TOO_LONG";
  return null;
}

export function validateNewsletterMessageBody(body: string): NewsletterValidationError | null {
  const t = body.trim();
  if (t.length === 0) return "BODY_REQUIRED";
  if (t.length > NEWSLETTER_LIMITS.MESSAGE_BODY_MAX) return "BODY_TOO_LONG";
  return null;
}
