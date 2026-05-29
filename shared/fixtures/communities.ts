/**
 * TEST_FIXTURE / MOCK_LOCAL_ONLY public-safe community directory.
 * No member identities, invites, join requests or private profile data.
 */
import type { CommunitiesShellData } from "@shared/contracts/communities";
import { toCommunityId } from "@shared/contracts/communities";

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
    },
    {
      id: toCommunityId("community-zdrowie-ruch"),
      slug: "zdrowie-ruch",
      name: "Zdrowie i ruch",
      description: "Społeczność specjalistów i osób dbających o aktywność.",
      visibility: "private",
      memberCount: 64,
      viewerRole: "member",
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
    },
    {
      id: toCommunityId("community-open-source"),
      slug: "open-source",
      name: "Open Source PL",
      description: "Wspólna praca nad projektami open source i mentoring.",
      visibility: "unlisted",
      memberCount: 87,
    },
  ],
};
