/**
 * application-v2/use-cases/public-hub — orchestration.
 *
 * Wires the public-hub COMPOSITION_DOMAIN to its data providers: identity
 * (public profile), communities-v2 (public summary) and modules (enabled keys).
 * Slice 10 adds optional module-domain wiring (topics-v2, events-v2,
 * integrations-v2, newsletter-chat-v2) so the use-case can surface a richer
 * hub view with per-slot data — without public-hub itself learning about any
 * of those domains.
 */
import type { IdentityService } from "@server/domains-v2/identity/public-api";
import type { CommunitiesService } from "@server/domains-v2/communities-v2/public-api";
import type {
  ModulesService,
  ModuleKey,
} from "@server/domains-v2/modules/public-api";
import {
  createPublicHubService,
  type HubOwnerSummary,
  type HubViewModel,
  type PublicHubResult,
} from "@server/domains-v2/public-hub/public-api";
import type {
  HubModulesResolver,
  HubOwnerResolver,
} from "@server/domains-v2/public-hub/contracts";
import { MODULE_DEFINITIONS } from "@server/domains-v2/modules/public-api";
import type { TopicsService } from "@server/domains-v2/topics-v2/public-api";
import type { EventsService } from "@server/domains-v2/events-v2/public-api";
import type { IntegrationsService } from "@server/domains-v2/integrations-v2/public-api";
import type { NewsletterChatService } from "@server/domains-v2/newsletter-chat-v2/public-api";
import type {
  HubModuleSlotDTO,
  ModuleSlotData,
  OwnerHubViewDTO,
  RichHubResult,
} from "./types";

export type PublicHubUseCaseDeps = {
  identity: IdentityService;
  communities: CommunitiesService;
  modules: ModulesService;
  /** Slice 10 module data providers — optional so existing callers keep working. */
  topics?: TopicsService;
  events?: EventsService;
  integrations?: IntegrationsService;
  newsletterChat?: NewsletterChatService;
  /** Requester id used to read the public profile; null for anonymous view. */
  viewerId?: string | null;
};

export interface PublicHubUseCase {
  getProfileHubView(ownerId: string): Promise<PublicHubResult<HubViewModel>>;
  getCommunityHubView(ownerId: string): Promise<PublicHubResult<HubViewModel>>;
  /** Slice 10 — richer view with per-module slot data. */
  getPersonalProfileHubView(ownerId: string): Promise<RichHubResult>;
  getCommunityHubViewWithSlots(ownerId: string): Promise<RichHubResult>;
}

function mapVisibility(v: string): "public" | "private" {
  return v === "public" ? "public" : "private";
}

function ownerResolver(deps: PublicHubUseCaseDeps): HubOwnerResolver {
  return {
    async getProfileSummary(ownerId): Promise<HubOwnerSummary | null> {
      const res = await deps.identity.getPublicProfile(deps.viewerId ?? null, ownerId);
      if (!res.ok) return null;
      const p = res.value;
      return {
        ownerType: "profile",
        ownerId: p.userId,
        displayName: p.displayName,
        handle: p.profileSlug,
        avatarRef: p.avatarMediaRef?.assetId ?? null,
        visibility: mapVisibility(p.visibility),
      };
    },
    async getCommunitySummary(ownerId): Promise<HubOwnerSummary | null> {
      const s = await deps.communities.getPublicSummary(ownerId);
      if (!s) return null;
      return {
        ownerType: "community",
        ownerId: s.id,
        displayName: s.name,
        handle: s.slug,
        avatarRef: null,
        visibility: s.visibility,
      };
    },
  };
}

function modulesResolver(deps: PublicHubUseCaseDeps): HubModulesResolver {
  return {
    async listEnabledModuleKeys(ownerType, ownerId) {
      const enabled = await deps.modules.listEnabledForOwner(ownerType, ownerId);
      return enabled.map((e) => e.moduleKey);
    },
  };
}

async function resolveSlotData(
  key: ModuleKey,
  ownerType: "profile" | "community",
  ownerId: string,
  deps: PublicHubUseCaseDeps,
): Promise<ModuleSlotData> {
  switch (key) {
    case "topics": {
      const topics = deps.topics ? await deps.topics.listTopicsForOwner(ownerType, ownerId) : [];
      return { kind: "topics", topics };
    }
    case "events": {
      const events = deps.events ? await deps.events.listEventsForOwner(ownerType, ownerId) : [];
      return { kind: "events", events };
    }
    case "integrations": {
      const integrations = deps.integrations
        ? await deps.integrations.listIntegrationsForOwner(ownerType, ownerId)
        : [];
      return { kind: "integrations", integrations };
    }
    case "newsletter_chat": {
      const newsletterChats = deps.newsletterChat
        ? await deps.newsletterChat.listNewsletterChatsForOwner(ownerType, ownerId)
        : [];
      return { kind: "newsletter_chat", newsletterChats };
    }
    case "channel_entry":
      return { kind: "channel_entry" };
    default: {
      // Exhaustive — but if MODULE_KEYS grows we fall back to "unknown".
      const _exhaustive: never = key;
      void _exhaustive;
      return { kind: "unknown" };
    }
  }
}

async function buildRichHub(
  ownerType: "profile" | "community",
  ownerId: string,
  deps: PublicHubUseCaseDeps,
): Promise<RichHubResult> {
  const resolver = ownerResolver(deps);
  const owner =
    ownerType === "profile"
      ? await resolver.getProfileSummary(ownerId)
      : await resolver.getCommunitySummary(ownerId);
  if (!owner) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Hub owner not found or not public." } };
  }
  const enabled = await deps.modules.listEnabledForOwner(ownerType, ownerId);
  const enabledKeys = new Set(enabled.map((e) => e.moduleKey));
  const sections: ("about" | "modules" | "channels" | "feed_preview")[] = ["about"];
  if (enabledKeys.size > 0) sections.push("modules");
  if (ownerType === "community" && enabledKeys.has("channel_entry")) sections.push("channels");
  if (ownerType === "profile") sections.push("feed_preview");

  const slots: HubModuleSlotDTO[] = [];
  for (const def of [...MODULE_DEFINITIONS].sort((a, b) => a.order - b.order)) {
    if (!def.allowedOwnerTypes.includes(ownerType)) continue;
    if (!enabledKeys.has(def.key)) continue;
    const data = await resolveSlotData(def.key, ownerType, ownerId, deps);
    slots.push({
      key: def.key,
      name: def.name,
      description: def.description,
      enabled: true,
      data,
    });
  }

  const view: OwnerHubViewDTO = {
    ownerType,
    ownerId,
    owner,
    sections,
    slots,
  };
  return { ok: true, value: view };
}

export function createPublicHubUseCase(deps: PublicHubUseCaseDeps): PublicHubUseCase {
  const hub = createPublicHubService({ owner: ownerResolver(deps), modules: modulesResolver(deps) });
  return {
    getProfileHubView: (ownerId) => hub.getProfileHubView(ownerId),
    getCommunityHubView: (ownerId) => hub.getCommunityHubView(ownerId),
    getPersonalProfileHubView: (ownerId) => buildRichHub("profile", ownerId, deps),
    getCommunityHubViewWithSlots: (ownerId) => buildRichHub("community", ownerId, deps),
  };
}
