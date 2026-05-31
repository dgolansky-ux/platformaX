/**
 * features-v2/public-hub — MOCK_LOCAL_ONLY transport.
 *
 * Composes the Public Hub view from the modules mock adapter (enablement
 * state) and locally-seeded per-module sample data. No `@server/*` imports.
 */
import { modulesMockAdapter } from "../modules";
import type {
  HubAdapterResult,
  HubEventUi,
  HubIntegrationUi,
  HubModuleSlotUi,
  HubNewsletterChatUi,
  HubOwnerSummaryUi,
  HubTopicUi,
  HubViewUiDTO,
  ModuleOwnerType,
} from "./types";

type OwnerSample = {
  owner: HubOwnerSummaryUi;
  topics: readonly HubTopicUi[];
  events: readonly HubEventUi[];
  integrations: readonly HubIntegrationUi[];
  newsletterChats: readonly HubNewsletterChatUi[];
};

const PROFILE_SAMPLE: Record<string, OwnerSample> = {
  "u-demo-ada": {
    owner: {
      ownerType: "profile",
      ownerId: "u-demo-ada",
      displayName: "Ada Demo",
      handle: "ada",
      avatarRef: null,
      visibility: "public",
    },
    topics: [
      {
        id: "t-ada-1",
        title: "Wellness",
        description: "Rozmowy o ruchu, śnie i regeneracji.",
        slug: "wellness",
        visibility: "public",
      },
      {
        id: "t-ada-2",
        title: "Czytane na weekend",
        description: "Krótkie recenzje książek i artykułów.",
        slug: "czytane",
        visibility: "public",
      },
    ],
    events: [
      {
        id: "e-ada-1",
        title: "Live Q&A — runda 4",
        description: "Pytania od subskrybentów na żywo.",
        startAt: "2026-06-10T18:00:00Z",
        endAt: null,
        locationType: "online",
        locationText: null,
        visibility: "public",
      },
    ],
    integrations: [
      {
        id: "i-ada-1",
        kind: "website",
        name: "Strona autorska",
        url: "https://ada.example",
        description: "Mój blog i archiwum tekstów.",
        visibility: "public",
      },
    ],
    newsletterChats: [
      {
        id: "n-ada-1",
        title: "Tygodniówka Ady",
        description: "Co tydzień jedna myśl + jeden link.",
        subscriberCount: 248,
        visibility: "public_preview",
      },
    ],
  },
};

const COMMUNITY_SAMPLE: Record<string, OwnerSample> = {
  "community-product-builders": {
    owner: {
      ownerType: "community",
      ownerId: "community-product-builders",
      displayName: "Product Builders",
      handle: "product-builders",
      avatarRef: null,
      visibility: "public",
    },
    topics: [
      {
        id: "t-pb-1",
        title: "Discovery",
        description: "Jak rozmawiać z klientem przed budową.",
        slug: "discovery",
        visibility: "public",
      },
    ],
    events: [
      {
        id: "e-pb-1",
        title: "Demo Day czerwiec",
        description: "Krótkie 5-minutowe prezentacje członków.",
        startAt: "2026-06-12T19:00:00Z",
        endAt: "2026-06-12T22:00:00Z",
        locationType: "hybrid",
        locationText: "Warszawa, Centrum + online",
        visibility: "public",
      },
    ],
    integrations: [
      {
        id: "i-pb-1",
        kind: "website",
        name: "Strona społeczności",
        url: "https://product-builders.example",
        description: null,
        visibility: "public",
      },
    ],
    newsletterChats: [
      {
        id: "n-pb-1",
        title: "Builders Broadcast",
        description: "Cotygodniowy zrzut z życia społeczności.",
        subscriberCount: 312,
        visibility: "public_preview",
      },
    ],
  },
  "community-zdrowie-ruch": {
    owner: {
      ownerType: "community",
      ownerId: "community-zdrowie-ruch",
      displayName: "Zdrowie i ruch",
      handle: "zdrowie-ruch",
      avatarRef: null,
      visibility: "private",
    },
    topics: [],
    events: [],
    integrations: [],
    newsletterChats: [],
  },
};

function pickSample(ownerType: ModuleOwnerType, ownerId: string): OwnerSample | null {
  if (ownerType === "profile") return PROFILE_SAMPLE[ownerId] ?? null;
  return COMMUNITY_SAMPLE[ownerId] ?? null;
}

const MODULE_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  topics: { name: "Tematy", description: "Tematyczne sekcje treści." },
  events: { name: "Wydarzenia", description: "Wydarzenia online i na żywo." },
  integrations: { name: "Integracje", description: "Linki do zasobów zewnętrznych." },
  newsletter_chat: { name: "Newsletter chatowy", description: "Broadcasty od autora do subskrybentów." },
  channel_entry: { name: "Kanały", description: "Wejście do kanałów społeczności." },
};

async function buildHub(
  ownerType: ModuleOwnerType,
  ownerId: string,
): Promise<HubAdapterResult<HubViewUiDTO>> {
  const sample = pickSample(ownerType, ownerId);
  if (!sample) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Hub owner not found." } };
  }
  const enabledKeys = await modulesMockAdapter.readEnablement(ownerType, ownerId);

  const slots: HubModuleSlotUi[] = [];
  if (enabledKeys.includes("topics")) {
    slots.push({
      key: "topics",
      name: MODULE_DESCRIPTIONS.topics.name,
      description: MODULE_DESCRIPTIONS.topics.description,
      topics: sample.topics.filter((t) => t.visibility === "public"),
    });
  }
  if (enabledKeys.includes("events")) {
    slots.push({
      key: "events",
      name: MODULE_DESCRIPTIONS.events.name,
      description: MODULE_DESCRIPTIONS.events.description,
      events: sample.events.filter((e) => e.visibility === "public"),
    });
  }
  if (enabledKeys.includes("integrations")) {
    slots.push({
      key: "integrations",
      name: MODULE_DESCRIPTIONS.integrations.name,
      description: MODULE_DESCRIPTIONS.integrations.description,
      integrations: sample.integrations.filter((i) => i.visibility === "public"),
    });
  }
  if (enabledKeys.includes("newsletter_chat")) {
    slots.push({
      key: "newsletter_chat",
      name: MODULE_DESCRIPTIONS.newsletter_chat.name,
      description: MODULE_DESCRIPTIONS.newsletter_chat.description,
      newsletterChats: sample.newsletterChats,
    });
  }
  if (ownerType === "community" && enabledKeys.includes("channel_entry")) {
    slots.push({
      key: "channel_entry",
      name: MODULE_DESCRIPTIONS.channel_entry.name,
      description: MODULE_DESCRIPTIONS.channel_entry.description,
    });
  }

  return {
    ok: true,
    value: {
      ownerType,
      ownerId,
      owner: { ...sample.owner },
      slots,
      hasModulesEnabled: slots.length > 0,
    },
  };
}

export const publicHubMockAdapter = {
  getProfileHub(ownerId: string) {
    return buildHub("profile", ownerId);
  },
  getCommunityHub(ownerId: string) {
    return buildHub("community", ownerId);
  },
};
