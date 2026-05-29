/**
 * modules — DTOs. Status: BACKEND_PARTIAL (in-memory runtime).
 *
 * privacy classification: Public DTO — module definitions + enablement flags
 * only. No PII, no business data (the owner domain keeps the real data).
 */

export type ModuleOwnerType = "profile" | "community";
export type ModuleStatus = "active" | "disabled";

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

export type ModuleDefinitionDTO = {
  key: ModuleKey;
  name: string;
  description: string;
  allowedOwnerTypes: readonly ModuleOwnerType[];
  status: ModuleStatus;
  order: number;
};

export type ModuleEnablementDTO = {
  ownerType: ModuleOwnerType;
  ownerId: string;
  moduleKey: ModuleKey;
  enabled: boolean;
  updatedAt: string;
};
