/**
 * application-v2/use-cases/manage — per-section builders (Slice 21).
 *
 * One small function per section. Each takes a snapshot and produces the
 * matching DTO. Helpers (visibilityLabel, maskEmail) are colocated.
 */
import type {
  AccountSection,
  ChannelsSection,
  ContactSection,
  FriendsSection,
  ManagedCommunitiesSection,
  MediaSection,
  ModulesSection,
  NotificationsSection,
  PrivacySection,
  ProfessionalSection,
  ProfileSection,
  SecuritySection,
  WorkplacesSection,
} from "@shared/contracts/manage-dashboard-sections";
import type {
  ManageSection,
  ManageSectionKey,
  ManageSectionStatus,
} from "@shared/contracts/manage-dashboard";
import type {
  ManageChannelsSnapshot,
  ManageCommunitiesSnapshot,
  ManageContactSnapshot,
  ManageFriendsSnapshot,
  ManageMediaSnapshot,
  ManageModulesSnapshot,
  ManageNotificationsSnapshot,
  ManageOwnerSummary,
  ManagePrivacySnapshot,
  ManageProfessionalSnapshot,
  ManageSecuritySnapshot,
  ManageWorkplacesSnapshot,
} from "./snapshots";

export function visibilityLabel(v: "public" | "friends_only" | "private"): string {
  switch (v) {
    case "public":
      return "Publiczne";
    case "friends_only":
      return "Tylko znajomi";
    case "private":
      return "Prywatne";
  }
}

export function maskEmail(addr: string | null): string | null {
  if (!addr) return null;
  const at = addr.indexOf("@");
  if (at <= 1) return "***" + addr.slice(at);
  return addr.slice(0, 1) + "***" + addr.slice(at);
}

export function buildAccount(owner: ManageOwnerSummary): AccountSection {
  return {
    key: "account",
    title: "Konto",
    description: "Nazwa profilu, login, adres e-mail konta i status.",
    status: owner.accountStatus === "active" ? "ready" : "blocked",
    routeTarget: "/manage/account",
    summaryItems: [
      { label: "Nazwa wyświetlana", value: owner.displayName },
      { label: "@username", value: `@${owner.handle}` },
      { label: "Status konta", value: owner.accountStatus === "active" ? "Aktywne" : owner.accountStatus === "limited" ? "Ograniczone" : "Zablokowane" },
    ],
    primaryAction: { label: "Ustawienia konta", routeTarget: "/manage/account", variant: "primary" },
    secondaryActions: [],
    warnings: [],
    username: owner.handle,
    displayName: owner.displayName,
    accountEmailMasked: maskEmail(owner.accountEmailMasked),
    accountStatus: owner.accountStatus,
  };
}

export function buildProfile(owner: ManageOwnerSummary): ProfileSection {
  return {
    key: "profile",
    title: "Profil osobisty",
    description: "Dane podstawowe, biografia, widoczność profilu. Zdjęcie i baner edytujesz na profilu.",
    status: owner.bioSummary ? "ready" : "needs_setup",
    routeTarget: "/manage/profil-osobisty",
    summaryItems: [
      { label: "Bio", value: owner.bioSummary ?? "Brak — uzupełnij" },
      { label: "Widoczność", value: visibilityLabel(owner.visibility) },
    ],
    primaryAction: { label: "Otwórz zarządzanie profilem", routeTarget: "/manage/profil-osobisty", variant: "primary" },
    secondaryActions: [
      { label: "Wygląd profilu (na profilu)", routeTarget: "/profile", variant: "secondary" },
    ],
    warnings: owner.bioSummary ? [] : ["Bio jest puste — uzupełnij na profilu."],
    bioSummary: owner.bioSummary,
    visibilityLabel: visibilityLabel(owner.visibility),
  };
}

export function buildPrivacy(snap: ManagePrivacySnapshot): PrivacySection {
  const allPrivate =
    snap.profileVisibility === "private" &&
    snap.publicHubVisibility === "private" &&
    snap.feedPreviewVisibility === "private";
  return {
    key: "privacy",
    title: "Prywatność",
    description: "Co widzą inni: profil, warstwa zawodowa, Public Hub, podgląd feedu, miejsca pracy.",
    status: "ready",
    routeTarget: "/manage/privacy",
    summaryItems: [
      { label: "Profil", value: visibilityLabel(snap.profileVisibility) },
      { label: "Warstwa zawodowa", value: visibilityLabel(snap.professionalLayerVisibility) },
      { label: "Public Hub", value: visibilityLabel(snap.publicHubVisibility) },
      { label: "Podgląd feedu", value: visibilityLabel(snap.feedPreviewVisibility) },
      { label: "Miejsca pracy", value: visibilityLabel(snap.workplaceVisibility) },
    ],
    primaryAction: { label: "Zmień widoczność", routeTarget: "/manage/privacy", variant: "primary" },
    secondaryActions: [],
    warnings: allPrivate ? ["Wszystko prywatne — znajomi nie zobaczą Twojego profilu."] : [],
    profileVisibility: snap.profileVisibility,
    professionalLayerVisibility: snap.professionalLayerVisibility,
    publicHubVisibility: snap.publicHubVisibility,
    feedPreviewVisibility: snap.feedPreviewVisibility,
    workplaceVisibility: snap.workplaceVisibility,
  };
}

export function buildContact(snap: ManageContactSnapshot): ContactSection {
  const status: ManageSectionStatus = snap.pendingRequestsCount > 0 ? "partial" : "ready";
  return {
    key: "contact",
    title: "Kontakt i zgody kontaktowe",
    description: "Komu udostępniasz e-mail / telefon. Znajomość ≠ dostęp do kontaktu.",
    status,
    routeTarget: "/manage/contact",
    summaryItems: [
      { label: "Zatwierdzone zgody", value: String(snap.approvedConsentsCount) },
      { label: "Oczekujące prośby", value: String(snap.pendingRequestsCount) },
      { label: "Cofnięte dostępy", value: String(snap.revokedAccessCount) },
      { label: "Domyślna widoczność", value: snap.defaultFieldVisibilityLabel },
    ],
    primaryAction: { label: "Zarządzaj zgodami", routeTarget: "/manage/contact", variant: "primary" },
    secondaryActions: [
      { label: "Prośby kontaktowe", routeTarget: "/contacts/requests", variant: "secondary" },
    ],
    warnings: snap.pendingRequestsCount > 0 ? [`Masz ${snap.pendingRequestsCount} nowych próśb.`] : [],
    approvedConsentsCount: snap.approvedConsentsCount,
    pendingRequestsCount: snap.pendingRequestsCount,
    revokedAccessCount: snap.revokedAccessCount,
    fieldsAvailable: snap.fieldsAvailable,
    defaultFieldVisibilityLabel: snap.defaultFieldVisibilityLabel,
  };
}

export function buildFriends(snap: ManageFriendsSnapshot): FriendsSection {
  const status: ManageSectionStatus = snap.invitesReceivedCount > 0 ? "partial" : "ready";
  return {
    key: "friends",
    title: "Znajomi i blokady",
    description: "Twoi znajomi, wysłane i odebrane zaproszenia, zablokowani użytkownicy.",
    status,
    routeTarget: "/manage/friends",
    summaryItems: [
      { label: "Znajomi", value: String(snap.friendsCount) },
      { label: "Wysłane zaproszenia", value: String(snap.invitesSentCount) },
      { label: "Odebrane zaproszenia", value: String(snap.invitesReceivedCount) },
      { label: "Zablokowani", value: String(snap.blockedCount) },
    ],
    primaryAction: { label: "Otwórz znajomych", routeTarget: "/friends", variant: "primary" },
    secondaryActions: [
      { label: "Zaproszenia", routeTarget: "/friends/requests", variant: "secondary" },
    ],
    warnings: snap.invitesReceivedCount > 0 ? [`Masz ${snap.invitesReceivedCount} nowych zaproszeń.`] : [],
    friendsCount: snap.friendsCount,
    invitesSentCount: snap.invitesSentCount,
    invitesReceivedCount: snap.invitesReceivedCount,
    blockedCount: snap.blockedCount,
  };
}

export function buildNotifications(snap: ManageNotificationsSnapshot): NotificationsSection {
  const partial = snap.categories.some((c) => c.transportPartial);
  return {
    key: "notifications",
    title: "Powiadomienia",
    description: "Kategorie powiadomień in-app. E-mail/push pojawi się po podpięciu transportu.",
    status: partial ? "partial" : "ready",
    routeTarget: "/manage/notifications",
    summaryItems: [
      { label: "Nieprzeczytane", value: String(snap.unreadTotal) },
      {
        label: "Kategorie aktywne",
        value: `${snap.categories.filter((c) => c.inAppEnabled).length} / ${snap.categories.length}`,
      },
    ],
    primaryAction: { label: "Ustawienia powiadomień", routeTarget: "/manage/notifications", variant: "primary" },
    secondaryActions: [
      { label: "Centrum aktywności", routeTarget: "/notifications", variant: "secondary" },
    ],
    warnings: partial ? ["E-mail / push: backend nie jest jeszcze podpięty (PARTIAL)."] : [],
    categories: snap.categories,
    unreadTotal: snap.unreadTotal,
  };
}

export function buildMedia(snap: ManageMediaSnapshot): MediaSection {
  const status: ManageSectionStatus = snap.uploadPipelineStatus === "ready" ? "ready" : snap.uploadPipelineStatus === "partial" ? "partial" : "blocked";
  return {
    key: "media",
    title: "Media",
    description: "Avatar, baner i media profilu. Upload przez pipeline media-v2.",
    status,
    routeTarget: "/manage/media",
    summaryItems: [
      { label: "Avatar", value: snap.hasAvatar ? "Ustawiony" : "Brak" },
      { label: "Baner", value: snap.hasBanner ? "Ustawiony" : "Brak" },
      { label: "Media profilu", value: String(snap.profileMediaCount) },
      { label: "Upload pipeline", value: snap.uploadPipelineStatus === "ready" ? "Gotowy" : snap.uploadPipelineStatus === "partial" ? "Częściowy" : "Zablokowany" },
    ],
    primaryAction: { label: "Zarządzaj mediami", routeTarget: "/manage/media", variant: "primary" },
    secondaryActions: [
      { label: "Edytuj na profilu", routeTarget: "/profile", variant: "secondary" },
    ],
    warnings: snap.uploadPipelineStatus === "blocked" ? ["Pipeline mediów jest zablokowany."] : [],
    hasAvatar: snap.hasAvatar,
    hasBanner: snap.hasBanner,
    profileMediaCount: snap.profileMediaCount,
    uploadPipelineStatus: snap.uploadPipelineStatus,
  };
}

export function buildProfessional(snap: ManageProfessionalSnapshot): ProfessionalSection {
  const empty = snap.selectedCategoriesCount === 0 && snap.selectedProfessionsCount === 0;
  return {
    key: "professional",
    title: "Warstwa zawodowa",
    description: "Wybrane kategorie, zawody i specjalizacje. Importowana baza pełna po podpięciu transportu.",
    status: empty ? "needs_setup" : "partial",
    routeTarget: "/manage/sekcja-zawodowa",
    summaryItems: [
      { label: "Kategorie", value: String(snap.selectedCategoriesCount) },
      { label: "Zawody", value: String(snap.selectedProfessionsCount) },
      { label: "Specjalizacje", value: String(snap.selectedSpecializationsCount) },
    ],
    primaryAction: { label: "Otwórz sekcję zawodową", routeTarget: "/manage/sekcja-zawodowa", variant: "primary" },
    secondaryActions: [],
    warnings: empty ? ["Sekcja zawodowa jest pusta — wybierz kategorię, aby aktywować."] : [],
    selectedCategoriesCount: snap.selectedCategoriesCount,
    selectedProfessionsCount: snap.selectedProfessionsCount,
    selectedSpecializationsCount: snap.selectedSpecializationsCount,
  };
}

export function buildWorkplaces(snap: ManageWorkplacesSnapshot): WorkplacesSection {
  const empty = snap.activeWorkplacesCount === 0 && snap.archivedWorkplacesCount === 0;
  return {
    key: "workplaces",
    title: "Miejsca pracy",
    description: "Aktywne i zarchiwizowane miejsca pracy. Nie mylić ze społecznością.",
    status: empty ? "needs_setup" : "ready",
    routeTarget: "/manage/workplaces",
    summaryItems: [
      { label: "Aktywne", value: String(snap.activeWorkplacesCount) },
      { label: "Archiwalne", value: String(snap.archivedWorkplacesCount) },
    ],
    primaryAction: { label: "Dodaj miejsce pracy", routeTarget: "/manage/profile/workplaces/new", variant: "primary" },
    secondaryActions: [
      { label: "Lista miejsc pracy", routeTarget: "/manage/workplaces", variant: "secondary" },
    ],
    warnings: [],
    activeWorkplacesCount: snap.activeWorkplacesCount,
    archivedWorkplacesCount: snap.archivedWorkplacesCount,
  };
}

export function buildModules(snap: ManageModulesSnapshot): ModulesSection {
  return {
    key: "modules",
    title: "Moduły profilu (Public Hub)",
    description: "Włączone moduły profilu i widoczność Public Hub.",
    status: snap.enabledModulesCount > 0 ? "ready" : "needs_setup",
    routeTarget: "/manage/modules",
    summaryItems: [
      { label: "Włączone moduły", value: String(snap.enabledModulesCount) },
      { label: "Widoczność Public Hub", value: snap.publicHubVisibilityLabel },
    ],
    primaryAction: { label: "Zarządzaj modułami", routeTarget: "/manage/modules", variant: "primary" },
    secondaryActions: [],
    warnings: [],
    enabledModulesCount: snap.enabledModulesCount,
    publicHubVisibilityLabel: snap.publicHubVisibilityLabel,
  };
}

export function buildChannels(snap: ManageChannelsSnapshot): ChannelsSection {
  return {
    key: "channels",
    title: "Kanały",
    description: "Kanały, które prowadzisz, i kanały, które obserwujesz.",
    status: snap.leadOfCount + snap.followingCount > 0 ? "ready" : "needs_setup",
    routeTarget: "/manage/channels",
    summaryItems: [
      { label: "Prowadzę", value: String(snap.leadOfCount) },
      { label: "Obserwuję", value: String(snap.followingCount) },
    ],
    primaryAction: { label: "Otwórz kanały", routeTarget: "/channels", variant: "primary" },
    secondaryActions: [
      { label: "Zarządzaj kanałami", routeTarget: "/manage/channels", variant: "secondary" },
    ],
    warnings: [],
    leadOfCount: snap.leadOfCount,
    followingCount: snap.followingCount,
  };
}

export function buildCommunities(snap: ManageCommunitiesSnapshot): ManagedCommunitiesSection {
  const total = snap.founderOfCount + snap.adminOfCount + snap.moderatorOfCount;
  return {
    key: "communities",
    title: "Społeczności zarządzane",
    description: "Społeczności, gdzie jesteś założycielem, adminem lub moderatorem.",
    status: total > 0 ? "ready" : "needs_setup",
    routeTarget: "/manage/communities",
    summaryItems: [
      { label: "Założyciel", value: String(snap.founderOfCount) },
      { label: "Admin", value: String(snap.adminOfCount) },
      { label: "Moderator", value: String(snap.moderatorOfCount) },
    ],
    primaryAction: { label: "Otwórz społeczności", routeTarget: "/communities", variant: "primary" },
    secondaryActions: [
      { label: "Lista zarządzanych", routeTarget: "/manage/communities", variant: "secondary" },
    ],
    warnings: [],
    founderOfCount: snap.founderOfCount,
    adminOfCount: snap.adminOfCount,
    moderatorOfCount: snap.moderatorOfCount,
  };
}

export function buildSecurity(snap: ManageSecuritySnapshot): SecuritySection {
  const status: ManageSectionStatus = snap.featureReadiness === "available" ? "ready" : "partial";
  return {
    key: "security",
    title: "Bezpieczeństwo i sesje",
    description: "Aktywne sesje, ostatnie logowanie, dwuetapowa weryfikacja.",
    status,
    routeTarget: "/manage/security",
    summaryItems: [
      { label: "Aktywne sesje", value: String(snap.activeSessionsCount) },
      { label: "Ostatnie logowanie", value: snap.lastSignInAt ?? "—" },
      { label: "2FA", value: snap.twoFactorEnabled ? "Włączone" : "Wyłączone" },
    ],
    primaryAction: {
      label: "Otwórz bezpieczeństwo",
      routeTarget: "/manage/security",
      variant: "primary",
      disabled: snap.featureReadiness === "future_ready",
      disabledReason: snap.featureReadiness === "future_ready" ? "W przygotowaniu" : undefined,
    },
    secondaryActions: [],
    warnings: snap.featureReadiness === "future_ready"
      ? ["Moduł bezpieczeństwa pojawi się po podpięciu transportu."]
      : [],
    activeSessionsCount: snap.activeSessionsCount,
    lastSignInAt: snap.lastSignInAt,
    twoFactorEnabled: snap.twoFactorEnabled,
    featureReadiness: snap.featureReadiness,
  };
}

export function collectStatuses(sections: readonly ManageSection[]): Readonly<Record<ManageSectionKey, ManageSectionStatus>> {
  const out: Partial<Record<ManageSectionKey, ManageSectionStatus>> = {};
  for (const s of sections) out[s.key] = s.status;
  return out as Readonly<Record<ManageSectionKey, ManageSectionStatus>>;
}
