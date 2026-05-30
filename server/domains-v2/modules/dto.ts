/**
 * modules — DTOs. Status: BACKEND_PARTIAL (in-memory runtime).
 *
 * privacy classification: Public DTO — module definitions + enablement flags
 * only. No PII, no business data (the owner domain keeps the real data).
 *
 * ownerType semantics: "profile" represents a personal user profile;
 * "community" represents a community. The slice 10 spec writes
 * `personal_profile` for emphasis; semantically equivalent to `profile`. The
 * shorter alias is preserved here for backwards compatibility with earlier
 * slices (communities, channels, channel_entry module).
 */

export type ModuleOwnerType = "profile" | "community";
export type ModuleStatus = "active" | "disabled" | "future";

/** Whitelisted module keys — the ONLY keys that may be enabled. */
export type ModuleKey =
  | "topics"
  | "events"
  | "integrations"
  | "newsletter_chat"
  | "channel_entry";

export const MODULE_KEYS: readonly ModuleKey[] = [
  "topics",
  "events",
  "integrations",
  "newsletter_chat",
  "channel_entry",
] as const;

/** Per-module visibility levels supported by the owner domain. */
export type ModuleVisibility = "public" | "members_only" | "private" | "owner_only";

export const MODULE_VISIBILITIES: readonly ModuleVisibility[] = [
  "public",
  "members_only",
  "private",
  "owner_only",
] as const;

export type ModuleCategory =
  | "content"
  | "social"
  | "events"
  | "integrations"
  | "broadcast";

export type ModuleDefinitionDTO = {
  key: ModuleKey;
  name: string;
  description: string;
  allowedOwnerTypes: readonly ModuleOwnerType[];
  status: ModuleStatus;
  order: number;
  category: ModuleCategory;
  icon: string;
  defaultEnabled: boolean;
  visibilitySupport: readonly ModuleVisibility[];
};

export type ModuleEnablementDTO = {
  ownerType: ModuleOwnerType;
  ownerId: string;
  moduleKey: ModuleKey;
  enabled: boolean;
  visibility: ModuleVisibility;
  order: number;
  createdAt: string;
  updatedAt: string;
};
