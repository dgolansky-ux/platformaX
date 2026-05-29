/**
 * identity / professions / import — dry-run validator. Pure over its inputs;
 * the only side effect is building a report. Never persists (DRY_RUN_ONLY).
 */
import type {
  ImportDryRunReport,
  ImportIssue,
  ImportProfessionRow,
} from "@shared/contracts/professions";
import {
  effectiveProfessionSlug,
  findDuplicateIssues,
  normalizeSlug,
  validateImportRow,
} from "../policy";

export function dryRunImport(
  rows: readonly ImportProfessionRow[],
  knownCategorySlugs: ReadonlySet<string>,
): ImportDryRunReport {
  const issues: ImportIssue[] = [];
  for (let i = 0; i < rows.length; i++) {
    issues.push(...validateImportRow(rows[i], i, knownCategorySlugs));
  }
  issues.push(...findDuplicateIssues(rows));

  const rowsWithIssues = new Set(issues.map((iss) => iss.rowIndex));
  const validRowIdx = rows.map((_, i) => i).filter((i) => !rowsWithIssues.has(i));

  const newProfessionSlugs = new Set<string>();
  const newSpecializationSlugs = new Set<string>();
  for (const i of validRowIdx) {
    const row = rows[i];
    newProfessionSlugs.add(effectiveProfessionSlug(row));
    if (row.specializationName && row.specializationName.trim().length > 0) {
      newSpecializationSlugs.add(
        row.specializationSlug ?? normalizeSlug(row.specializationName),
      );
    }
  }

  return {
    mode: "dry_run",
    totalRows: rows.length,
    validRows: validRowIdx.length,
    newProfessions: newProfessionSlugs.size,
    newSpecializations: newSpecializationSlugs.size,
    issues,
    persisted: false,
  };
}
