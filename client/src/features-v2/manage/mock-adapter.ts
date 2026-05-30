/**
 * features-v2/manage — MOCK_LOCAL_ONLY adapter (Slice 21).
 *
 * Builds a realistic Manage Dashboard view without any `@server/*` import,
 * no localStorage, no fake save. Owner-only access is enforced: requesting
 * a dashboard for a different userId returns an OWNER_MISMATCH error.
 *
 * The shape returned here matches `ManageDashboardDTO` from
 * `@shared/contracts/manage-dashboard`, so the future HTTP transport can
 * be a drop-in replacement.
 */
import type {
  ManageDashboardAdapter,
  ManageDashboardDTO,
  ManageDashboardResult,
  ManageSection,
  ManageSectionStatus,
  AccountSection,
  ProfileSection,
  PrivacySection,
  ContactSection,
  FriendsSection,
  NotificationsSection,
  MediaSection,
  ProfessionalSection,
  WorkplacesSection,
  ModulesSection,
  ChannelsSection,
  ManagedCommunitiesSection,
  SecuritySection,
} from "./types";

const DEMO_OWNER_ID = "u-viewer";

function visibilityLabel(v: "public" | "friends_only" | "private"): string {
  if (v === "public") return "Publiczne";
  if (v === "friends_only") return "Tylko znajomi";
  return "Prywatne";
}

function demoAccount(): AccountSection {
  return {
    key: "account",
    title: "Konto",
    description: "Nazwa profilu, login, adres e-mail konta i status.",
    status: "ready",
    routeTarget: "/manage/account",
    summaryItems: [
      { label: "Nazwa wyświetlana", value: "Demo użytkownik" },
      { label: "@username", value: "@demo" },
      { label: "Status konta", value: "Aktywne" },
    ],
    primaryAction: { label: "Ustawienia konta", routeTarget: "/manage/account", variant: "primary" },
    secondaryActions: [],
    warnings: [],
    username: "demo",
    displayName: "Demo użytkownik",
    accountEmailMasked: "d***@example.com",
    accountStatus: "active",
  };
}

function demoProfile(): ProfileSection {
  return {
    key: "profile",
    title: "Profil osobisty",
    description: "Dane podstawowe, biografia, widoczność profilu. Zdjęcie i baner edytujesz na profilu.",
    status: "ready",
    routeTarget: "/manage/profil-osobisty",
    summaryItems: [
      { label: "Bio", value: "Buduję PlatformęX" },
      { label: "Widoczność", value: visibilityLabel("friends_only") },
    ],
    primaryAction: { label: "Otwórz zarządzanie profilem", routeTarget: "/manage/profil-osobisty", variant: "primary" },
    secondaryActions: [
      { label: "Wygląd profilu (na profilu)", routeTarget: "/profile", variant: "secondary" },
    ],
    warnings: [],
    bioSummary: "Buduję PlatformęX",
    visibilityLabel: visibilityLabel("friends_only"),
  };
}

function demoPrivacy(): PrivacySection {
  return {
    key: "privacy",
    title: "Prywatność",
    description: "Co widzą inni: profil, warstwa zawodowa, Public Hub, podgląd feedu, miejsca pracy.",
    status: "ready",
    routeTarget: "/manage/privacy",
    summaryItems: [
      { label: "Profil", value: visibilityLabel("friends_only") },
      { label: "Warstwa zawodowa", value: visibilityLabel("public") },
      { label: "Public Hub", value: visibilityLabel("public") },
      { label: "Podgląd feedu", value: visibilityLabel("friends_only") },
      { label: "Miejsca pracy", value: visibilityLabel("public") },
    ],
    primaryAction: { label: "Zmień widoczność", routeTarget: "/manage/privacy", variant: "primary" },
    secondaryActions: [],
    warnings: [],
    profileVisibility: "friends_only",
    professionalLayerVisibility: "public",
    publicHubVisibility: "public",
    feedPreviewVisibility: "friends_only",
    workplaceVisibility: "public",
  };
}

function demoContact(): ContactSection {
  return {
    key: "contact",
    title: "Kontakt i zgody kontaktowe",
    description: "Komu udostępniasz e-mail / telefon. Znajomość ≠ dostęp do kontaktu.",
    status: "partial",
    routeTarget: "/manage/contact",
    summaryItems: [
      { label: "Zatwierdzone zgody", value: "2" },
      { label: "Oczekujące prośby", value: "1" },
      { label: "Cofnięte dostępy", value: "0" },
      { label: "Domyślna widoczność", value: "Tylko po zgodzie" },
    ],
    primaryAction: { label: "Zarządzaj zgodami", routeTarget: "/manage/contact", variant: "primary" },
    secondaryActions: [
      { label: "Prośby kontaktowe", routeTarget: "/contacts/requests", variant: "secondary" },
    ],
    warnings: ["Masz 1 nową prośbę."],
    approvedConsentsCount: 2,
    pendingRequestsCount: 1,
    revokedAccessCount: 0,
    fieldsAvailable: ["email", "phone"],
    defaultFieldVisibilityLabel: "Tylko po zgodzie",
  };
}

function demoFriends(): FriendsSection {
  return {
    key: "friends",
    title: "Znajomi i blokady",
    description: "Twoi znajomi, wysłane i odebrane zaproszenia, zablokowani użytkownicy.",
    status: "partial",
    routeTarget: "/manage/friends",
    summaryItems: [
      { label: "Znajomi", value: "12" },
      { label: "Wysłane zaproszenia", value: "3" },
      { label: "Odebrane zaproszenia", value: "2" },
      { label: "Zablokowani", value: "0" },
    ],
    primaryAction: { label: "Otwórz znajomych", routeTarget: "/friends", variant: "primary" },
    secondaryActions: [
      { label: "Zaproszenia", routeTarget: "/friends/requests", variant: "secondary" },
    ],
    warnings: ["Masz 2 nowe zaproszenia."],
    friendsCount: 12,
    invitesSentCount: 3,
    invitesReceivedCount: 2,
    blockedCount: 0,
  };
}

function demoNotifications(): NotificationsSection {
  return {
    key: "notifications",
    title: "Powiadomienia",
    description: "Kategorie powiadomień in-app. E-mail/push pojawi się po podpięciu transportu.",
    status: "partial",
    routeTarget: "/manage/notifications",
    summaryItems: [
      { label: "Nieprzeczytane", value: "4" },
      { label: "Kategorie aktywne", value: "5 / 6" },
    ],
    primaryAction: { label: "Ustawienia powiadomień", routeTarget: "/manage/notifications", variant: "primary" },
    secondaryActions: [
      { label: "Centrum aktywności", routeTarget: "/notifications", variant: "secondary" },
    ],
    warnings: ["E-mail / push: backend nie jest jeszcze podpięty (PARTIAL)."],
    categories: [
      { key: "friend_feed", label: "Feed znajomych", inAppEnabled: true, transportPartial: false },
      { key: "communities", label: "Społeczności", inAppEnabled: true, transportPartial: false },
      { key: "channels", label: "Kanały", inAppEnabled: true, transportPartial: false },
      { key: "professional_profile", label: "Profil zawodowy", inAppEnabled: true, transportPartial: false },
      { key: "modules", label: "Moduły", inAppEnabled: true, transportPartial: false },
      { key: "system", label: "System", inAppEnabled: false, transportPartial: true },
    ],
    unreadTotal: 4,
  };
}

function demoMedia(): MediaSection {
  return {
    key: "media",
    title: "Media",
    description: "Avatar, baner i media profilu. Upload przez pipeline media-v2.",
    status: "partial",
    routeTarget: "/manage/media",
    summaryItems: [
      { label: "Avatar", value: "Ustawiony" },
      { label: "Baner", value: "Brak" },
      { label: "Media profilu", value: "3" },
      { label: "Upload pipeline", value: "Częściowy" },
    ],
    primaryAction: { label: "Zarządzaj mediami", routeTarget: "/manage/media", variant: "primary" },
    secondaryActions: [
      { label: "Edytuj na profilu", routeTarget: "/profile", variant: "secondary" },
    ],
    warnings: [],
    hasAvatar: true,
    hasBanner: false,
    profileMediaCount: 3,
    uploadPipelineStatus: "partial",
  };
}

function demoProfessional(): ProfessionalSection {
  return {
    key: "professional",
    title: "Warstwa zawodowa",
    description: "Wybrane kategorie, zawody i specjalizacje. Importowana baza pełna po podpięciu transportu.",
    status: "partial",
    routeTarget: "/manage/sekcja-zawodowa",
    summaryItems: [
      { label: "Kategorie", value: "1" },
      { label: "Zawody", value: "0" },
      { label: "Specjalizacje", value: "0" },
    ],
    primaryAction: { label: "Otwórz sekcję zawodową", routeTarget: "/manage/sekcja-zawodowa", variant: "primary" },
    secondaryActions: [],
    warnings: [],
    selectedCategoriesCount: 1,
    selectedProfessionsCount: 0,
    selectedSpecializationsCount: 0,
  };
}

function demoWorkplaces(): WorkplacesSection {
  return {
    key: "workplaces",
    title: "Miejsca pracy",
    description: "Aktywne i zarchiwizowane miejsca pracy. Nie mylić ze społecznością.",
    status: "ready",
    routeTarget: "/manage/workplaces",
    summaryItems: [
      { label: "Aktywne", value: "1" },
      { label: "Archiwalne", value: "0" },
    ],
    primaryAction: { label: "Dodaj miejsce pracy", routeTarget: "/manage/profile/workplaces/new", variant: "primary" },
    secondaryActions: [
      { label: "Lista miejsc pracy", routeTarget: "/manage/workplaces", variant: "secondary" },
    ],
    warnings: [],
    activeWorkplacesCount: 1,
    archivedWorkplacesCount: 0,
  };
}

function demoModules(): ModulesSection {
  return {
    key: "modules",
    title: "Moduły profilu (Public Hub)",
    description: "Włączone moduły profilu i widoczność Public Hub.",
    status: "ready",
    routeTarget: "/manage/modules",
    summaryItems: [
      { label: "Włączone moduły", value: "2" },
      { label: "Widoczność Public Hub", value: "Publiczne" },
    ],
    primaryAction: { label: "Zarządzaj modułami", routeTarget: "/manage/modules", variant: "primary" },
    secondaryActions: [],
    warnings: [],
    enabledModulesCount: 2,
    publicHubVisibilityLabel: "Publiczne",
  };
}

function demoChannels(): ChannelsSection {
  return {
    key: "channels",
    title: "Kanały",
    description: "Kanały, które prowadzisz, i kanały, które obserwujesz.",
    status: "ready",
    routeTarget: "/manage/channels",
    summaryItems: [
      { label: "Prowadzę", value: "1" },
      { label: "Obserwuję", value: "5" },
    ],
    primaryAction: { label: "Otwórz kanały", routeTarget: "/channels", variant: "primary" },
    secondaryActions: [
      { label: "Zarządzaj kanałami", routeTarget: "/manage/channels", variant: "secondary" },
    ],
    warnings: [],
    leadOfCount: 1,
    followingCount: 5,
  };
}

function demoCommunities(): ManagedCommunitiesSection {
  return {
    key: "communities",
    title: "Społeczności zarządzane",
    description: "Społeczności, gdzie jesteś założycielem, adminem lub moderatorem.",
    status: "ready",
    routeTarget: "/manage/communities",
    summaryItems: [
      { label: "Założyciel", value: "1" },
      { label: "Admin", value: "0" },
      { label: "Moderator", value: "1" },
    ],
    primaryAction: { label: "Otwórz społeczności", routeTarget: "/communities", variant: "primary" },
    secondaryActions: [
      { label: "Lista zarządzanych", routeTarget: "/manage/communities", variant: "secondary" },
    ],
    warnings: [],
    founderOfCount: 1,
    adminOfCount: 0,
    moderatorOfCount: 1,
  };
}

function demoSecurity(): SecuritySection {
  return {
    key: "security",
    title: "Bezpieczeństwo i sesje",
    description: "Aktywne sesje, ostatnie logowanie, dwuetapowa weryfikacja.",
    status: "partial",
    routeTarget: "/manage/security",
    summaryItems: [
      { label: "Aktywne sesje", value: "1" },
      { label: "Ostatnie logowanie", value: "2026-05-30 10:00" },
      { label: "2FA", value: "Wyłączone" },
    ],
    primaryAction: {
      label: "Otwórz bezpieczeństwo",
      routeTarget: "/manage/security",
      variant: "primary",
      disabled: true,
      disabledReason: "W przygotowaniu",
    },
    secondaryActions: [],
    warnings: ["Moduł bezpieczeństwa pojawi się po podpięciu transportu."],
    activeSessionsCount: 1,
    lastSignInAt: "2026-05-30T10:00:00.000Z",
    twoFactorEnabled: false,
    featureReadiness: "future_ready",
  };
}

function buildDemoDashboard(ownerId: string): ManageDashboardDTO {
  const sections: ManageSection[] = [
    demoAccount(),
    demoProfile(),
    demoPrivacy(),
    demoContact(),
    demoFriends(),
    demoNotifications(),
    demoMedia(),
    demoProfessional(),
    demoWorkplaces(),
    demoModules(),
    demoChannels(),
    demoCommunities(),
    demoSecurity(),
  ];

  const sectionStatuses = sections.reduce<Record<string, ManageSectionStatus>>((acc, s) => {
    acc[s.key] = s.status;
    return acc;
  }, {});

  return {
    header: {
      ownerUserId: ownerId,
      ownerDisplayName: "Demo użytkownik",
      ownerHandle: "demo",
      ownerAvatarInitial: "D",
      generatedAt: new Date().toISOString(),
      runtimeBackend: "mock",
    },
    sections,
    sectionStatuses: sectionStatuses as ManageDashboardDTO["sectionStatuses"],
  };
}

export function createManageMockAdapter(): ManageDashboardAdapter {
  return {
    async getManageDashboardView(currentUserId, targetUserId): Promise<ManageDashboardResult> {
      if (!currentUserId) {
        return { ok: false, error: { code: "UNAUTHENTICATED", message: "Wymagane zalogowanie." } };
      }
      if (currentUserId !== targetUserId) {
        return {
          ok: false,
          error: {
            code: "OWNER_MISMATCH",
            message: "Panel zarządzania jest tylko dla właściciela profilu.",
          },
        };
      }
      return { ok: true, value: buildDemoDashboard(currentUserId) };
    },
  };
}

export const manageMockAdapter = createManageMockAdapter();
export { DEMO_OWNER_ID as MANAGE_DEMO_OWNER_ID };
