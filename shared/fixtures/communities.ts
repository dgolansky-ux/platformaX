/**
 * TEST_FIXTURE / MOCK_LOCAL_ONLY public-safe community directory.
 *
 * No member identities, invites, join requests or private profile data leak
 * here. Display names are public reference data (handles/labels), not PII.
 */
import {
  toCommunityId,
  type CommunitiesShellData,
  type CommunityChannelSummaryDTO,
  type CommunityHubViewDTO,
  type CommunityJoinRequestSummaryDTO,
  type CommunityMemberSummaryDTO,
  type CommunityModuleSummaryDTO,
  type CommunityProfileDTO,
} from "@shared/contracts/communities";

export const FIXTURE_VIEWER_USER_ID = "u-viewer-demo";

export const COMMUNITIES_SHELL_FIXTURE: CommunitiesShellData = {
  myCommunities: [
    {
      id: toCommunityId("community-product-builders"),
      slug: "product-builders",
      name: "Product Builders",
      description: "Praktyczne rozmowy o budowaniu produktów cyfrowych.",
      visibility: "public",
      memberCount: 128,
      viewerRole: "founder",
      viewerRelation: "founder",
    },
    {
      id: toCommunityId("community-zdrowie-ruch"),
      slug: "zdrowie-ruch",
      name: "Zdrowie i ruch",
      description: "Społeczność specjalistów i osób dbających o aktywność.",
      visibility: "private",
      memberCount: 64,
      viewerRole: "member",
      viewerRelation: "member",
    },
  ],
  discoverCommunities: [
    {
      id: toCommunityId("community-local-events"),
      slug: "lokalne-wydarzenia",
      name: "Lokalne wydarzenia",
      description: "Miejsca, spotkania i inicjatywy w Twojej okolicy.",
      visibility: "public",
      memberCount: 312,
      viewerRelation: "not_member",
    },
    {
      id: toCommunityId("community-open-source"),
      slug: "open-source",
      name: "Open Source PL",
      description: "Wspólna praca nad projektami open source i mentoring.",
      visibility: "unlisted",
      memberCount: 87,
      viewerRelation: "not_member",
    },
  ],
};

export type CommunityFixtureSeed = {
  profile: CommunityProfileDTO;
  members: readonly CommunityMemberSummaryDTO[];
  joinRequests: readonly CommunityJoinRequestSummaryDTO[];
  modules: readonly CommunityModuleSummaryDTO[];
  channels: readonly CommunityChannelSummaryDTO[];
};

const MODULE_CATALOG: Record<string, { name: string; description: string }> = {
  topics: { name: "Tematy", description: "Tematyczne sekcje treści." },
  events: { name: "Wydarzenia", description: "Spotkania i RSVP (bez płatności)." },
  integrations: { name: "Integracje", description: "Proste linki/integracje zewnętrzne." },
  newsletter_chat: { name: "Newsletter / czat", description: "Kanał broadcast/newsletter." },
  channel_entry: { name: "Kanały", description: "Wejście do kanałów społeczności." },
};

function moduleSeed(enabled: Record<string, boolean>): CommunityModuleSummaryDTO[] {
  return Object.entries(MODULE_CATALOG).map(([key, def]) => ({
    key,
    name: def.name,
    description: def.description,
    enabled: enabled[key] === true,
  }));
}

export const COMMUNITY_MODULE_CATALOG = moduleSeed({});

export const COMMUNITY_SEED_FIXTURES: readonly CommunityFixtureSeed[] = [
  {
    profile: {
      id: toCommunityId("community-product-builders"),
      slug: "product-builders",
      name: "Product Builders",
      description: "Praktyczne rozmowy o budowaniu produktów cyfrowych.",
      visibility: "public",
      memberCount: 3,
      viewerRelation: "founder",
      canManage: true,
    },
    members: [
      { userId: FIXTURE_VIEWER_USER_ID, displayName: "Demo użytkownik", role: "founder", joinedAt: "2026-05-20T08:00:00Z" },
      { userId: "u-anna-pm", displayName: "Anna PM", role: "admin", joinedAt: "2026-05-21T09:30:00Z" },
      { userId: "u-marek-dev", displayName: "Marek Dev", role: "member", joinedAt: "2026-05-22T12:15:00Z" },
    ],
    joinRequests: [
      { id: "jr-1", requesterUserId: "u-kasia-design", requesterDisplayName: "Kasia Design", createdAt: "2026-05-28T10:00:00Z" },
    ],
    modules: moduleSeed({ topics: true, channel_entry: true, events: true }),
    channels: [
      {
        id: "ch-pb-general",
        slug: "ogolny",
        name: "Ogólny",
        description: "Główny kanał społeczności.",
        visibility: "public",
        followerCount: 42,
        viewerFollows: true,
      },
      {
        id: "ch-pb-news",
        slug: "newsletter",
        name: "Newsletter",
        description: "Cotygodniowe podsumowania.",
        visibility: "public",
        followerCount: 18,
        viewerFollows: false,
      },
    ],
  },
  {
    profile: {
      id: toCommunityId("community-zdrowie-ruch"),
      slug: "zdrowie-ruch",
      name: "Zdrowie i ruch",
      description: "Społeczność specjalistów i osób dbających o aktywność.",
      visibility: "private",
      memberCount: 2,
      viewerRelation: "member",
      canManage: false,
    },
    members: [
      { userId: "u-zdr-founder", displayName: "Zofia Trener", role: "founder", joinedAt: "2026-04-10T08:00:00Z" },
      { userId: FIXTURE_VIEWER_USER_ID, displayName: "Demo użytkownik", role: "member", joinedAt: "2026-05-01T08:00:00Z" },
    ],
    joinRequests: [],
    modules: moduleSeed({ events: true, integrations: true }),
    channels: [],
  },
  {
    profile: {
      id: toCommunityId("community-local-events"),
      slug: "lokalne-wydarzenia",
      name: "Lokalne wydarzenia",
      description: "Miejsca, spotkania i inicjatywy w Twojej okolicy.",
      visibility: "public",
      memberCount: 1,
      viewerRelation: "not_member",
      canManage: false,
    },
    members: [
      { userId: "u-jan-loc", displayName: "Jan Lokalny", role: "founder", joinedAt: "2026-03-05T08:00:00Z" },
    ],
    joinRequests: [],
    modules: moduleSeed({ events: true }),
    channels: [],
  },
  {
    profile: {
      id: toCommunityId("community-open-source"),
      slug: "open-source",
      name: "Open Source PL",
      description: "Wspólna praca nad projektami open source i mentoring.",
      visibility: "unlisted",
      memberCount: 1,
      viewerRelation: "not_member",
      canManage: false,
    },
    members: [
      { userId: "u-os-founder", displayName: "Olga Open", role: "founder", joinedAt: "2026-02-12T08:00:00Z" },
    ],
    joinRequests: [],
    modules: moduleSeed({ topics: true, channel_entry: true }),
    channels: [],
  },
];

export function buildHubViewFromSeed(seed: CommunityFixtureSeed): CommunityHubViewDTO {
  return {
    owner: {
      id: seed.profile.id,
      slug: seed.profile.slug,
      name: seed.profile.name,
      visibility: seed.profile.visibility,
    },
    modules: seed.modules,
    channels: seed.channels,
  };
}
