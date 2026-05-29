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
  effectiveSpecializationSlug,
  findDuplicateIssues,
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
  // Specializations are keyed per profession — the same spec slug under two
  // different professions counts as two distinct specializations.
  const newSpecializationKeys = new Set<string>();
  for (const i of validRowIdx) {
    const row = rows[i];
    const professionSlug = effectiveProfessionSlug(row);
    newProfessionSlugs.add(professionSlug);
    const specSlug = effectiveSpecializationSlug(row);
    if (specSlug) newSpecializationKeys.add(`${professionSlug}::${specSlug}`);
  }

  return {
    mode: "dry_run",
    totalRows: rows.length,
    validRows: validRowIdx.length,
    newProfessions: newProfessionSlugs.size,
    newSpecializations: newSpecializationKeys.size,
    issues,
    persisted: false,
  };
}
