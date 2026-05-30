/**
 * features-v2/manage — UI-side type re-exports for Slice 21.
 *
 * The DTO contract lives in @shared/contracts/manage-dashboard so the UI
 * never imports from @server/* directly. Adapter signature mirrors the
 * server-side ManageApplicationService.getManageDashboardView contract.
 */
export type {
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
} from "@shared/contracts/manage-dashboard";
export type {
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

import type { ManageDashboardResult } from "@shared/contracts/manage-dashboard";

export interface ManageDashboardAdapter {
  getManageDashboardView(
    currentUserId: string,
    targetUserId: string,
  ): Promise<ManageDashboardResult>;
}
