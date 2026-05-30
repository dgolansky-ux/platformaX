/**
 * features-v2/personal-profile — seeded fixture profiles for the
 * MOCK_LOCAL_ONLY adapter.
 *
 * Four profiles cover every viewer relation:
 *  - `u-viewer` (slug `viewer`) — the demo signed-in user.
 *  - `u-ada` (slug `ada`) — already a friend of `u-viewer` (seed in adapter).
 *  - `u-kuba` (slug `kuba`) — stranger; viewer can send friend request.
 *  - `u-private` (slug `private`) — restricted state for non-owner viewers.
 */
import type { ApprovedContactField } from "@shared/contracts/contacts";
import type {
  ProfilePublicHubModuleDTO,
  ProfileWorkplaceCardDTO,
  ProfileWorkplaceVisibility,
} from "@shared/contracts/personal-profile-view";

export interface SeededContactField {
  field: ApprovedContactField;
  value: string;
  friendsVisible: boolean;
  approvedVisible: boolean;
}

export interface SeededProfile {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  location: string | null;
  publicSummary: string | null;
  visibility: "public" | "friends" | "private";
  contactFields: readonly SeededContactField[];
  workplaces: readonly ProfileWorkplaceCardDTO[];
  publicHubModules: readonly ProfilePublicHubModuleDTO[];
  channelCount: number | null;
}

function workplace(
  workplaceId: string,
  ownerUserId: string,
  name: string,
  slug: string,
  headline: string,
  visibility: ProfileWorkplaceVisibility,
): ProfileWorkplaceCardDTO {
  return { workplaceId, ownerUserId, name, slug, headline, logoRef: null, visibility };
}

function viewerProfile(): SeededProfile {
  return {
    userId: "u-viewer",
    username: "viewer",
    displayName: "Marek Viewer",
    avatarUrl: null,
    bannerUrl: null,
    bio: "Demo użytkownik PlatformyX V2.",
    location: "Kraków",
    publicSummary: "Buduję i testuję — bez sciemy.",
    visibility: "public",
    contactFields: [
      { field: "instagram", value: "@marek.viewer", friendsVisible: true, approvedVisible: true },
      { field: "website", value: "https://viewer.example", friendsVisible: false, approvedVisible: true },
      { field: "phone", value: "+48 600 000 100", friendsVisible: false, approvedVisible: true },
    ],
    workplaces: [
      workplace("wp-viewer-1", "u-viewer", "Studio Viewer", "studio-viewer", "Projekty UX/UI", "public"),
    ],
    publicHubModules: [
      { key: "topics", enabled: true },
      { key: "events", enabled: true },
      { key: "newsletter", enabled: false },
      { key: "integrations", enabled: false },
    ],
    channelCount: 1,
  };
}

function adaProfile(): SeededProfile {
  return {
    userId: "u-ada",
    username: "ada",
    displayName: "Ada Lovelace",
    avatarUrl: null,
    bannerUrl: null,
    bio: "Czytam, piszę, projektuję, biegam.",
    location: "Warszawa",
    publicSummary: "Profil zawodowy + projekty.",
    visibility: "public",
    contactFields: [
      { field: "instagram", value: "@ada.lovelace", friendsVisible: true, approvedVisible: true },
      { field: "linkedin", value: "in/ada-lovelace", friendsVisible: true, approvedVisible: true },
      { field: "emailContact", value: "ada@example.com", friendsVisible: false, approvedVisible: true },
      { field: "phone", value: "+48 700 000 700", friendsVisible: false, approvedVisible: true },
    ],
    workplaces: [
      workplace("wp-ada-1", "u-ada", "Ada Studio", "ada-studio", "Doradztwo + warsztaty", "public"),
      workplace("wp-ada-2", "u-ada", "Projekt Backup", "ada-backup", "Wewnętrzny projekt", "friends_only"),
      workplace("wp-ada-3", "u-ada", "Sekret", "ada-sekret", "Tylko Ada", "private"),
    ],
    publicHubModules: [
      { key: "topics", enabled: true },
      { key: "events", enabled: true },
      { key: "newsletter", enabled: true },
      { key: "integrations", enabled: false },
    ],
    channelCount: 2,
  };
}

function kubaProfile(): SeededProfile {
  return {
    userId: "u-kuba",
    username: "kuba",
    displayName: "Kuba Demo",
    avatarUrl: null,
    bannerUrl: null,
    bio: "Programista, biega rano.",
    location: "Gdańsk",
    publicSummary: "Open source + warsztaty.",
    visibility: "public",
    contactFields: [
      { field: "linkedin", value: "in/kuba-demo", friendsVisible: true, approvedVisible: true },
      { field: "emailContact", value: "kuba@example.com", friendsVisible: false, approvedVisible: true },
    ],
    workplaces: [
      workplace("wp-kuba-1", "u-kuba", "Kuba Code", "kuba-code", "Konsultacje + audyt", "public"),
    ],
    publicHubModules: [
      { key: "topics", enabled: false },
      { key: "events", enabled: true },
      { key: "newsletter", enabled: false },
      { key: "integrations", enabled: false },
    ],
    channelCount: 0,
  };
}

function privateProfile(): SeededProfile {
  return {
    userId: "u-private",
    username: "private",
    displayName: "Prywatny Profil",
    avatarUrl: null,
    bannerUrl: null,
    bio: null,
    location: null,
    publicSummary: null,
    visibility: "private",
    contactFields: [],
    workplaces: [],
    publicHubModules: [],
    channelCount: null,
  };
}

export function seedProfiles(): readonly SeededProfile[] {
  return [viewerProfile(), adaProfile(), kubaProfile(), privateProfile()];
}
