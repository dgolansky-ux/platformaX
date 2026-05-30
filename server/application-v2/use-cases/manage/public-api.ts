/**
 * application-v2/use-cases/manage — public API surface (Slice 21).
 *
 * Server-side composition entry point for the Manage Dashboard orchestrator.
 * Only callers under `server/` may import this module. The frontend depends
 * on `@shared/contracts/manage-dashboard` for the DTO shape and on its own
 * feature-local adapter under `client/src/features-v2/manage` to call the
 * future HTTP controller.
 */
export { createManageApplicationService } from "./service";
export type {
  ManageApplicationService,
  ManageApplicationServiceDeps,
} from "./service";
export type {
  ManageChannelsSnapshot,
  ManageCommunitiesSnapshot,
  ManageContactSnapshot,
  ManageDashboardPort,
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
export { makeManageError } from "./errors";
export type {
  ManageApplicationError,
  ManageApplicationResult,
  ManageApplicationUpdateResult,
} from "./errors";
export type {
  ManageDashboardDTO,
  ManageDashboardHeader,
  ManageSection,
  ManageSectionKey,
  ManageSectionStatus,
  ManageSectionAction,
  ManageSectionSummaryItem,
  ManageSectionBase,
} from "@shared/contracts/manage-dashboard";
export type {
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
} from "@shared/contracts/manage-dashboard-sections";
