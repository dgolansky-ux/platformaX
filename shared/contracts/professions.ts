/**
 * shared/contracts/professions — cross-boundary contract for the V2
 * professional section (Zarządzaj → Sekcja zawodowa).
 *
 * Status: categories = REFERENCE_DATA_READY; professions + specializations =
 * DATA_PENDING (the owner ships the full dataset later via the import
 * pipeline). These types are intentionally future-ready: no profession or
 * specialization rows are invented here.
 *
 * No PII: categories/professions/specializations are public reference data —
 * name/slug/icon/order/status only.
 */

/** Lifecycle of an imported profession/specialization row. */
export type ProfessionStatus = "active" | "pending" | "rejected" | "deleted";

/** Public reference-data category. `id` is the stable key (= slug for seeds). */
export type ProfessionCategoryDTO = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  order: number;
  status: "active";
};

/** Future-ready: a profession within a category. No seed rows ship today. */
export type ProfessionDTO = {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  status: ProfessionStatus;
};

/** Future-ready: a specialization within a profession. No seed rows today. */
export type SpecializationDTO = {
  id: string;
  name: string;
  slug: string;
  professionSlug: string;
  status: ProfessionStatus;
};

/**
 * Honest readiness signal. `data_pending` means "the dataset has not been
 * imported yet" — the UI renders a truthful pending state, never a fake list.
 */
export type ReferenceDataResult<T> =
  | { state: "ready"; items: readonly T[]; nextCursor: string | null }
  | { state: "data_pending" };

/** One row of the future import package the owner will send. */
export type ImportProfessionRow = {
  categorySlug: string;
  professionName: string;
  professionSlug?: string;
  specializationName?: string;
  specializationSlug?: string;
  status?: ProfessionStatus;
  aliases?: readonly string[];
};

export type ImportIssueCode =
  | "EMPTY_NAME"
  | "INVALID_SLUG"
  | "DUPLICATE_SLUG"
  | "DUPLICATE_NAME"
  | "UNKNOWN_CATEGORY";

export type ImportIssue = {
  rowIndex: number;
  field: string;
  code: ImportIssueCode;
  message: string;
};

/** Result of a validate-only / dry-run import — never persists anything. */
export type ImportDryRunReport = {
  mode: "dry_run";
  totalRows: number;
  validRows: number;
  newProfessions: number;
  newSpecializations: number;
  issues: readonly ImportIssue[];
  persisted: false;
};
