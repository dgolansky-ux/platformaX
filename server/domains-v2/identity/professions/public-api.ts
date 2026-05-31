/**
 * identity / professions — public API surface.
 *
 * Other domains / the application layer import ONLY from here. Internal files
 * (repository, service impl, policy, mapper, import internals) are not reached
 * cross-domain.
 *
 * Status: categories = REFERENCE_DATA_READY; professions + specializations =
 * DATA_PENDING; import pipeline = IMPORT_CONTRACT_READY / DRY_RUN_ONLY; admin
 * moderation = SKELETON_ONLY.
 */
export { createProfessionsService } from "./service";
export type { ProfessionsService, ProfessionsServiceDeps } from "./service";
export { createInMemoryProfessionsRepository } from "./reference-store";
export type { ProfessionsReferenceRepository } from "./contracts";
export type { ProfessionsImportPipeline } from "./import/professions-import.contract";
export { dryRunImport } from "./import/professions-import.validator";
export { normalizeSlug, isValidSlug, sortByOrder } from "./policy";
export { applyModeration, canModerate } from "./moderation";
export type { ModerationDecision, ModerationResult } from "./moderation";
export type {
  ProposalStatus,
  ProfessionProposalRecord,
  CustomSpecializationDraft,
} from "./dto";
