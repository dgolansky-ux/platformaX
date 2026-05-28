/**
 * Deterministic, PII-safe dev/test seed fixtures.
 *
 * Rule: PX-SEED-001. Fixed IDs, no real PII (no emails, phone numbers, dates of
 * birth, secrets), no randomness, no faker dependency. Shapes use the public,
 * PII-free wire contracts so a seed can never carry private data.
 */
import {
  asCommunityId,
  asUserId,
  type CommunityId,
  type UserId,
} from "../contracts/ids";
import type { PublicProfileView } from "../contracts/profile-view";

export const SEED_OWNER_USER_ID: UserId = asUserId("seed-user-0001");
export const SEED_FRIEND_USER_ID: UserId = asUserId("seed-user-0002");
export const SEED_COMMUNITY_ID: CommunityId = asCommunityId("seed-community-0001");

/** Public-safe profile fixture — by type it cannot contain PII. */
export const seedPublicProfile: PublicProfileView = {
  profileUserId: SEED_OWNER_USER_ID,
  profileSlug: "seed-owner",
  displayName: "Seed Owner",
  bio: "Deterministyczny profil testowy. Bez danych prywatnych.",
  location: "Testowo",
  civilStatus: null,
  socialLinks: { website: "https://example.org/seed-owner" },
  personalStatus: {
    text: "buduję",
    emoji: "🛠️",
    description: null,
    visibility: "public",
    photo: null,
  },
  visibility: "public",
  onboardingCompleted: true,
  avatar: null,
  banner: null,
  isOwner: false,
};

export interface SeedContact {
  id: string;
  displayName: string;
  initial: string;
}

export const seedContacts: ReadonlyArray<SeedContact> = [
  { id: "seed-contact-0001", displayName: "Kontakt Pierwszy", initial: "K" },
  { id: "seed-contact-0002", displayName: "Kontakt Drugi", initial: "K" },
];

export interface SeedCommunity {
  id: CommunityId;
  name: string;
  slug: string;
  memberCount: number;
}

export const seedCommunity: SeedCommunity = {
  id: SEED_COMMUNITY_ID,
  name: "Społeczność Testowa",
  slug: "seed-community",
  memberCount: 2,
};
