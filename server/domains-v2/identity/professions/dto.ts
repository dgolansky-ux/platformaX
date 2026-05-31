/**
 * identity / professions — DTO surface. Re-exports the cross-boundary public
 * DTOs and adds the proposal/moderation types used by the (skeleton-only)
 * admin moderation flow.
 *
 * privacy classification: Public DTO — reference data + a user-id reference,
 * proposed name/slug and status only. No PII (no phone/email/dateOfBirth).
 */
export type {
  ProfessionCategoryDTO,
  ProfessionDTO,
  SpecializationDTO,
  ProfessionStatus,
  ReferenceDataResult,
  ImportProfessionRow,
  ImportDryRunReport,
  ImportIssue,
  ImportIssueCode,
} from "@shared/contracts/professions";

/** Lifecycle of a user-submitted "add a new profession" proposal. */
export type ProposalStatus = "pending" | "approved" | "rejected" | "merged";

/** SKELETON_ONLY: shape a proposal will take once a runtime store exists. */
export type ProfessionProposalRecord = {
  id: string;
  proposedName: string;
  proposedSlug: string;
  categorySlug: string;
  proposedByUserId: string;
  status: ProposalStatus;
  mergedIntoSlug: string | null;
  createdAt: string;
};

/** Custom specialization model — prepared, NOT enabled (DATA_PENDING). */
export type CustomSpecializationDraft = {
  professionSlug: string;
  proposedName: string;
  proposedSlug: string;
  proposedByUserId: string;
};
