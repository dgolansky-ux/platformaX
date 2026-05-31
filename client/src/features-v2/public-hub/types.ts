/**
 * features-v2/public-hub — UI types. Mirrors the application-v2/use-cases
 * shapes so the frontend doesn't import @server/*.
 */
import type {
  ModuleKey,
  ModuleOwnerType,
  ModuleVisibility,
} from "../modules";

export type { ModuleKey, ModuleOwnerType, ModuleVisibility };

export interface HubOwnerSummaryUi {
  ownerType: ModuleOwnerType;
  ownerId: string;
  displayName: string;
  handle: string | null;
  avatarRef: string | null;
  visibility: "public" | "private";
}

export interface HubTopicUi {
  id: string;
  title: string;
  description: string;
  slug: string;
  visibility: ModuleVisibility;
}

export interface HubEventUi {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string | null;
  locationType: "online" | "offline" | "hybrid";
  locationText: string | null;
  visibility: ModuleVisibility;
}

export interface HubIntegrationUi {
  id: string;
  kind: "external_link" | "website" | "social" | "embed_placeholder";
  name: string;
  url: string;
  description: string | null;
  visibility: ModuleVisibility;
}

export interface HubNewsletterChatUi {
  id: string;
  title: string;
  description: string;
  subscriberCount: number;
  visibility: "public_preview" | "subscribers_only" | "members_only";
}

export type HubModuleSlotUi =
  | { key: "topics"; name: string; description: string; topics: readonly HubTopicUi[] }
  | { key: "events"; name: string; description: string; events: readonly HubEventUi[] }
  | { key: "integrations"; name: string; description: string; integrations: readonly HubIntegrationUi[] }
  | { key: "newsletter_chat"; name: string; description: string; newsletterChats: readonly HubNewsletterChatUi[] }
  | { key: "channel_entry"; name: string; description: string };

export interface HubViewUiDTO {
  ownerType: ModuleOwnerType;
  ownerId: string;
  owner: HubOwnerSummaryUi;
  slots: readonly HubModuleSlotUi[];
  hasModulesEnabled: boolean;
}

export type HubAdapterResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: "NOT_FOUND" | "ADAPTER_FAILURE"; message: string } };
