/**
 * application-v2/use-cases/public-hub — composed hub view types (Slice 10).
 *
 * These DTOs add per-module slot data on top of the basic public-hub domain
 * composition. The domain composes the module-key list; this use-case
 * orchestrates each module domain's public-api into a single, viewer-safe
 * surface. NO PII passes through.
 */
import type {
  HubOwnerSummary,
  HubSectionKey,
  HubViewModel,
} from "@server/domains-v2/public-hub/public-api";
import type { ModuleKey } from "@server/domains-v2/modules/public-api";
import type { TopicPublicDTO } from "@server/domains-v2/topics-v2/public-api";
import type { EventPublicDTO } from "@server/domains-v2/events-v2/public-api";
import type { IntegrationPublicDTO } from "@server/domains-v2/integrations-v2/public-api";
import type { NewsletterChatPublicDTO } from "@server/domains-v2/newsletter-chat-v2/public-api";

export type ModuleSlotData =
  | { kind: "topics"; topics: readonly TopicPublicDTO[] }
  | { kind: "events"; events: readonly EventPublicDTO[] }
  | { kind: "integrations"; integrations: readonly IntegrationPublicDTO[] }
  | { kind: "newsletter_chat"; newsletterChats: readonly NewsletterChatPublicDTO[] }
  | { kind: "channel_entry" }
  | { kind: "unknown" };

export interface HubModuleSlotDTO {
  key: ModuleKey;
  name: string;
  description: string;
  enabled: boolean;
  data: ModuleSlotData;
}

export interface OwnerHubViewDTO {
  ownerType: "profile" | "community";
  ownerId: string;
  owner: HubOwnerSummary;
  sections: readonly HubSectionKey[];
  slots: readonly HubModuleSlotDTO[];
}

export interface RichHubResultOk {
  ok: true;
  value: OwnerHubViewDTO;
}

export interface RichHubResultErr {
  ok: false;
  error: { code: "NOT_FOUND"; message: string };
}

export type RichHubResult = RichHubResultOk | RichHubResultErr;

/** Re-export so callers don't need two imports for the basic view. */
export type { HubViewModel };
