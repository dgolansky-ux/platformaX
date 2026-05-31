/**
 * shared/contracts/manage-dashboard-base — shared building blocks for the
 * Slice 21 ManageDashboardDTO. Holds the primitive types used by both
 * `manage-dashboard.ts` (top-level DTO) and `manage-dashboard-sections.ts`
 * (per-section discriminated types) so the two never form an import cycle.
 *
 * No PII fields. Pure type definitions.
 */

export type ManageSectionStatus =
  | "ready"
  | "partial"
  | "needs_setup"
  | "blocked";

export type ManageSectionKey =
  | "account"
  | "profile"
  | "privacy"
  | "contact"
  | "friends"
  | "notifications"
  | "media"
  | "professional"
  | "workplaces"
  | "modules"
  | "channels"
  | "communities"
  | "security";

export interface ManageSectionAction {
  readonly label: string;
  readonly routeTarget: string;
  readonly variant: "primary" | "secondary";
  readonly disabled?: boolean;
  readonly disabledReason?: string;
}

export interface ManageSectionSummaryItem {
  readonly label: string;
  readonly value: string;
}

export interface ManageSectionBase {
  readonly key: ManageSectionKey;
  readonly title: string;
  readonly description: string;
  readonly status: ManageSectionStatus;
  readonly routeTarget: string;
  readonly summaryItems: readonly ManageSectionSummaryItem[];
  readonly primaryAction: ManageSectionAction;
  readonly secondaryActions: readonly ManageSectionAction[];
  readonly warnings: readonly string[];
}
