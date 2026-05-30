/**
 * features-v2/modules — UI types. Mirrors the server public-api shapes so the
 * frontend doesn't import @server/*. The mock adapter is the only producer.
 */

export type ModuleOwnerType = "profile" | "community";

export type ModuleVisibility = "public" | "members_only" | "private" | "owner_only";

export type ModuleStatus = "active" | "disabled" | "future";

export type ModuleKey =
  | "topics"
  | "events"
  | "integrations"
  | "newsletter_chat"
  | "channel_entry";

export interface ModuleDefinitionUiDTO {
  key: ModuleKey;
  name: string;
  description: string;
  allowedOwnerTypes: readonly ModuleOwnerType[];
  status: ModuleStatus;
  order: number;
  icon: string;
  visibilitySupport: readonly ModuleVisibility[];
}

export interface ModuleEnablementUiDTO {
  key: ModuleKey;
  name: string;
  description: string;
  enabled: boolean;
  visibility: ModuleVisibility;
  allowedOwnerTypes: readonly ModuleOwnerType[];
  visibilitySupport: readonly ModuleVisibility[];
}

export interface ModuleOwnerContextUiDTO {
  ownerType: ModuleOwnerType;
  ownerId: string;
  ownerDisplayName: string;
  canManage: boolean;
}

export type AdapterError = {
  code: "NOT_FOUND" | "FORBIDDEN" | "OWNER_TYPE_NOT_ALLOWED" | "ADAPTER_FAILURE";
  message: string;
};

export type AdapterResult<T> = { ok: true; value: T } | { ok: false; error: AdapterError };

export interface ToggleModuleInput {
  ownerType: ModuleOwnerType;
  ownerId: string;
  moduleKey: ModuleKey;
  enabled: boolean;
}
