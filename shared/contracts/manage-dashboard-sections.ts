/**
 * shared/contracts/manage-dashboard-sections — per-section discriminated types
 * for the Slice 21 ManageDashboardDTO.
 *
 * ALLOW_PRIVATE_DTO_PII — this file uses the literal "email" and "phone" as
 * enumeration values (e.g. `fieldsAvailable`), NOT as field names carrying
 * raw owner contact data. The orchestrator masks the actual e-mail
 * (`accountEmailMasked`) and never returns raw phone digits anywhere in
 * the DTO. The marker satisfies `check-public-dto-pii.mjs` while keeping
 * literal unions type-safe.
 */
import type {
  ManageSectionBase,
} from "./manage-dashboard-base";

export interface AccountSection extends ManageSectionBase {
  readonly key: "account";
  readonly username: string;
  readonly displayName: string;
  readonly accountEmailMasked: string | null;
  readonly accountStatus: "active" | "limited" | "blocked";
}

export interface ProfileSection extends ManageSectionBase {
  readonly key: "profile";
  readonly bioSummary: string | null;
  readonly visibilityLabel: string;
}

export interface PrivacySection extends ManageSectionBase {
  readonly key: "privacy";
  readonly profileVisibility: "public" | "friends_only" | "private";
  readonly professionalLayerVisibility: "public" | "friends_only" | "private";
  readonly publicHubVisibility: "public" | "friends_only" | "private";
  readonly feedPreviewVisibility: "public" | "friends_only" | "private";
  readonly workplaceVisibility: "public" | "friends_only" | "private";
}

/**
 * ContactFieldKind kept inline to stay under the per-file exports budget.
 * The orchestrator/UI use the literal union directly; if a public alias is
 * ever needed it can move to a dedicated file (e.g. `contact-fields.ts`).
 */
export interface ContactSection extends ManageSectionBase {
  readonly key: "contact";
  readonly approvedConsentsCount: number;
  readonly pendingRequestsCount: number;
  readonly revokedAccessCount: number;
  readonly fieldsAvailable: readonly ("email" | "phone")[];
  readonly defaultFieldVisibilityLabel: string;
}

export interface FriendsSection extends ManageSectionBase {
  readonly key: "friends";
  readonly friendsCount: number;
  readonly invitesSentCount: number;
  readonly invitesReceivedCount: number;
  readonly blockedCount: number;
}

export interface NotificationsSection extends ManageSectionBase {
  readonly key: "notifications";
  readonly categories: readonly {
    readonly key:
      | "friend_feed"
      | "communities"
      | "channels"
      | "professional_profile"
      | "modules"
      | "system";
    readonly label: string;
    readonly inAppEnabled: boolean;
    readonly transportPartial: boolean;
  }[];
  readonly unreadTotal: number;
}

export interface MediaSection extends ManageSectionBase {
  readonly key: "media";
  readonly hasAvatar: boolean;
  readonly hasBanner: boolean;
  readonly profileMediaCount: number;
  readonly uploadPipelineStatus: "ready" | "partial" | "blocked";
}

export interface ProfessionalSection extends ManageSectionBase {
  readonly key: "professional";
  readonly selectedCategoriesCount: number;
  readonly selectedProfessionsCount: number;
  readonly selectedSpecializationsCount: number;
}

export interface WorkplacesSection extends ManageSectionBase {
  readonly key: "workplaces";
  readonly activeWorkplacesCount: number;
  readonly archivedWorkplacesCount: number;
}

export interface ModulesSection extends ManageSectionBase {
  readonly key: "modules";
  readonly enabledModulesCount: number;
  readonly publicHubVisibilityLabel: string;
}

export interface ChannelsSection extends ManageSectionBase {
  readonly key: "channels";
  readonly leadOfCount: number;
  readonly followingCount: number;
}

export interface ManagedCommunitiesSection extends ManageSectionBase {
  readonly key: "communities";
  readonly founderOfCount: number;
  readonly adminOfCount: number;
  readonly moderatorOfCount: number;
}

export interface SecuritySection extends ManageSectionBase {
  readonly key: "security";
  readonly activeSessionsCount: number;
  readonly lastSignInAt: string | null;
  readonly twoFactorEnabled: boolean;
  readonly featureReadiness: "future_ready" | "partial" | "available";
}
