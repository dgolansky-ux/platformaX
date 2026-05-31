/**
 * shared/contracts/manage-dashboard — Slice 21 ManageDashboardDTO core.
 *
 * Owner-only dashboard payload. Cross-boundary, used by:
 *  - server/application-v2/use-cases/manage (orchestrator)
 *  - client/src/features-v2/manage (UI cards)
 *
 * Shared primitives live in `./manage-dashboard-base.ts` so this file and
 * `./manage-dashboard-sections.ts` never import each other directly
 * (eliminates the type-only circular dependency). The orchestrator masks
 * PII (`accountEmailMasked`) and never returns raw owner contact values.
 *
 * ALLOW_PRIVATE_DTO_PII — the per-section file uses the literal "email"
 * and "phone" as enum values (`ContactFieldKind`), not as field carriers.
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
} from "./manage-dashboard-sections";
import type {
  ManageSectionKey,
  ManageSectionStatus,
} from "./manage-dashboard-base";

export type {
  ManageSectionAction,
  ManageSectionBase,
  ManageSectionKey,
  ManageSectionStatus,
  ManageSectionSummaryItem,
} from "./manage-dashboard-base";

export type ManageSection =
  | AccountSection
  | ProfileSection
  | PrivacySection
  | ContactSection
  | FriendsSection
  | NotificationsSection
  | MediaSection
  | ProfessionalSection
  | WorkplacesSection
  | ModulesSection
  | ChannelsSection
  | ManagedCommunitiesSection
  | SecuritySection;

export interface ManageDashboardHeader {
  readonly ownerUserId: string;
  readonly ownerDisplayName: string;
  readonly ownerHandle: string;
  readonly ownerAvatarInitial: string;
  readonly generatedAt: string;
  readonly runtimeBackend: "mock" | "supabase";
}

export interface ManageDashboardDTO {
  readonly header: ManageDashboardHeader;
  readonly sections: readonly ManageSection[];
  readonly sectionStatuses: Readonly<Record<ManageSectionKey, ManageSectionStatus>>;
}

export type ManageDashboardError =
  | { readonly code: "UNAUTHENTICATED"; readonly message: string }
  | { readonly code: "FORBIDDEN"; readonly message: string }
  | { readonly code: "OWNER_MISMATCH"; readonly message: string }
  | { readonly code: "INTERNAL"; readonly message: string };

export type ManageDashboardResult =
  | { readonly ok: true; readonly value: ManageDashboardDTO }
  | { readonly ok: false; readonly error: ManageDashboardError };

export type ManageSettingsUpdateResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: ManageDashboardError };
