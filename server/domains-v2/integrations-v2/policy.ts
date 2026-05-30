/**
 * integrations-v2 — pure validation policy. URL safety is enforced here.
 *
 * Allowed URL schemes: http(s) and mailto only. javascript:, data:, file:,
 * vbscript: and similar embed-poison schemes are rejected at validation time.
 */
import {
  INTEGRATION_DESCRIPTION_MAX,
  INTEGRATION_NAME_MAX,
  INTEGRATION_URL_MAX,
  type IntegrationKind,
  type IntegrationVisibility,
} from "./dto";

export type IntegrationValidationError =
  | "NAME_REQUIRED"
  | "NAME_TOO_LONG"
  | "DESCRIPTION_TOO_LONG"
  | "URL_REQUIRED"
  | "URL_TOO_LONG"
  | "URL_UNSAFE_SCHEME"
  | "URL_INVALID"
  | "KIND_INVALID"
  | "VISIBILITY_INVALID";

const VISIBILITIES: readonly IntegrationVisibility[] = ["public", "private", "members_only"];
const KINDS: readonly IntegrationKind[] = [
  "external_link",
  "website",
  "social",
  "embed_placeholder",
];

const ALLOWED_SCHEMES = new Set(["http:", "https:", "mailto:"]);

export function isIntegrationVisibility(v: string): v is IntegrationVisibility {
  return (VISIBILITIES as readonly string[]).includes(v);
}

export function isIntegrationKind(v: string): v is IntegrationKind {
  return (KINDS as readonly string[]).includes(v);
}

export function validateIntegrationName(name: string): IntegrationValidationError | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "NAME_REQUIRED";
  if (trimmed.length > INTEGRATION_NAME_MAX) return "NAME_TOO_LONG";
  return null;
}

export function validateIntegrationDescription(description: string | null | undefined): IntegrationValidationError | null {
  if (description && description.length > INTEGRATION_DESCRIPTION_MAX) return "DESCRIPTION_TOO_LONG";
  return null;
}

export function validateIntegrationUrl(url: string): IntegrationValidationError | null {
  if (url.length === 0) return "URL_REQUIRED";
  if (url.length > INTEGRATION_URL_MAX) return "URL_TOO_LONG";
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "URL_INVALID";
  }
  if (!ALLOWED_SCHEMES.has(parsed.protocol)) return "URL_UNSAFE_SCHEME";
  return null;
}
