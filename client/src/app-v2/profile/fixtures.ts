/**
 * Typed mock fixtures for the personal profile mobile shell.
 * MOCK_LOCAL_ONLY — no backend, no PII (phone/dateOfBirth/private email).
 */
import type {
  PersonalProfileView,
  ProfileContact,
  QuickFeedItem,
  SocialLink,
} from "./types";

const SOCIAL_LINKS: ReadonlyArray<SocialLink> = [
  { id: "li", kind: "linkedin", label: "LinkedIn", url: "https://linkedin.com/in/" },
  { id: "gh", kind: "github", label: "GitHub", url: "https://github.com/" },
  { id: "web", kind: "website", label: "Strona WWW", url: "https://example.org" },
];

const CONTACTS: ReadonlyArray<ProfileContact> = [
  { id: "c1", firstName: "Marek", lastName: "Zieliński", initial: "M", online: true, category: "close" },
  { id: "c2", firstName: "Ola", lastName: "Nowak", initial: "O", online: false, category: "close" },
  { id: "c3", firstName: "Piotr", lastName: "Lewandowski", initial: "P", online: true, category: "family_close" },
  { id: "c4", firstName: "Kasia", lastName: "Wójcik", initial: "K", online: false, category: "family_extended" },
  { id: "c5", firstName: "Tomasz", lastName: "Kamiński", initial: "T", online: true, category: "close" },
  { id: "c6", firstName: "Ewa", lastName: "Szymańska", initial: "E", online: false, category: "family_close" },
];

const QUICK_FEED: ReadonlyArray<QuickFeedItem> = [
  { id: "q1", authorInitial: "M", authorName: "Marek" },
  { id: "q2", authorInitial: "O", authorName: "Ola" },
  { id: "q3", authorInitial: "P", authorName: "Piotr" },
];

/** Empty social/feed surface shown when a section has no runtime yet. */
export const EMPTY_SOCIAL_LINKS: ReadonlyArray<SocialLink> = [];
export const EMPTY_CONTACTS: ReadonlyArray<ProfileContact> = [];
export const EMPTY_QUICK_FEED: ReadonlyArray<QuickFeedItem> = [];

/**
 * Public viewer's baseline profile. Social/feed sections start empty because
 * `social`/`content-v2` runtime is not wired yet — the shell renders them as
 * empty rather than faking data through the identity boundary.
 */
export const publicPersonalProfile: PersonalProfileView = {
  userId: null,
  displayName: "Profil",
  avatarInitial: "?",
  avatarUrl: null,
  bannerUrl: null,
  location: null,
  bio: null,
  status: null,
  socialLinks: EMPTY_SOCIAL_LINKS,
  contacts: EMPTY_CONTACTS,
  quickFeed: EMPTY_QUICK_FEED,
  presentationPostCount: 0,
  milestoneCount: 0,
  isOwner: false,
};

/** Owner viewing their own personal profile. Content sections start empty. */
export const ownerPersonalProfile: PersonalProfileView = {
  userId: null,
  displayName: "Anna Kowalska",
  avatarInitial: "A",
  avatarUrl: null,
  bannerUrl: null,
  location: "Warszawa",
  bio: "Projektuję spokojne produkty cyfrowe i buduję społeczności wokół wspólnych celów.",
  status: {
    emoji: "✨",
    state: "produktywny",
    description: "Pracuję nad nowym projektem",
    visibility: "friends",
  },
  socialLinks: SOCIAL_LINKS,
  contacts: CONTACTS,
  quickFeed: QUICK_FEED,
  presentationPostCount: 0,
  milestoneCount: 0,
  isOwner: true,
};
