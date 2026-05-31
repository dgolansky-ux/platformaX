/**
 * identity / professions / import — the contract for the FUTURE data package.
 *
 * Status: IMPORT_CONTRACT_READY / DRY_RUN_ONLY. The owner will send the full
 * professions + specializations dataset later; this module fixes the shape
 * and the dry-run surface now. Nothing here persists or pushes to a DB.
 */
import type {
  ImportDryRunReport,
  ImportProfessionRow,
} from "@shared/contracts/professions";

export type { ImportDryRunReport, ImportProfessionRow };

export interface ProfessionsImportPipeline {
  /**
   * Validate-only. Returns a structured report of issues and would-be
   * inserts. NEVER writes — `report.persisted` is always `false`.
   */
  dryRun(rows: readonly ImportProfessionRow[]): Promise<ImportDryRunReport>;
}
