/**
 * topics-v2 — pure validation policy. No data access, no side effects.
 */
import {
  TOPIC_DESCRIPTION_MAX,
  TOPIC_SLUG_MAX,
  TOPIC_SLUG_RE,
  TOPIC_TITLE_MAX,
  type TopicVisibility,
} from "./dto";

export type TopicValidationError =
  | "TITLE_REQUIRED"
  | "TITLE_TOO_LONG"
  | "DESCRIPTION_TOO_LONG"
  | "SLUG_INVALID"
  | "VISIBILITY_INVALID";

const VISIBILITIES: readonly TopicVisibility[] = ["public", "private", "members_only"];

export function isTopicVisibility(value: string): value is TopicVisibility {
  return (VISIBILITIES as readonly string[]).includes(value);
}

export function validateTopicTitle(title: string): TopicValidationError | null {
  const trimmed = title.trim();
  if (trimmed.length === 0) return "TITLE_REQUIRED";
  if (trimmed.length > TOPIC_TITLE_MAX) return "TITLE_TOO_LONG";
  return null;
}

export function validateTopicDescription(description: string): TopicValidationError | null {
  if (description.length > TOPIC_DESCRIPTION_MAX) return "DESCRIPTION_TOO_LONG";
  return null;
}

export function validateTopicSlug(slug: string): TopicValidationError | null {
  if (slug.length === 0 || slug.length > TOPIC_SLUG_MAX) return "SLUG_INVALID";
  if (!TOPIC_SLUG_RE.test(slug)) return "SLUG_INVALID";
  return null;
}
