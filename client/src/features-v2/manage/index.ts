/**
 * features-v2/manage — public surface (Slice 21).
 */
export { ManageDashboardPage } from "./ManageDashboardPage";
export { ManageSectionCard } from "./ManageSectionCard";
export { ManageStatusBadge } from "./ManageStatusBadge";
export { createManageMockAdapter, manageMockAdapter, MANAGE_DEMO_OWNER_ID } from "./mock-adapter";
export {
  PrivacyEditorPanel,
  NotificationsEditorPanel,
  ContactConsentsPanel,
} from "./editors";
export type {
  PrivacyKey,
  PrivacyLevel,
  PrivacyState,
  NotificationCategoryKey,
  NotificationCategoryRow,
  ConsentItem,
  ConsentStatus,
} from "./editors";
export type {
  ManageDashboardAdapter,
  ManageDashboardDTO,
  ManageDashboardError,
  ManageDashboardHeader,
  ManageDashboardResult,
  ManageSection,
  ManageSectionAction,
  ManageSectionBase,
  ManageSectionKey,
  ManageSectionStatus,
  ManageSectionSummaryItem,
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
