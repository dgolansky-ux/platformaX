/**
 * identity / professions — pure policy. No I/O, no time, no side effects.
 * Slug normalization, slug validation, order sorting, deleted-row filtering,
 * and the import dry-run validation rules all live here so the service and
 * the future import pipeline share one source of truth.
 */
import type {
  ImportIssue,
  ImportProfessionRow,
  ProfessionStatus,
} from "@shared/contracts/professions";

const PL_MAP: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
};

/** Polish-aware slugify: lowercase, strip diacritics, hyphenate the rest. */
export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (ch) => PL_MAP[ch] ?? ch)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

/** Reference data is ordered by `order` ASC — never by name. */
export function sortByOrder<T extends { order: number }>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => a.order - b.order);
}

/** Soft-delete aware: rows with status "deleted" are excluded everywhere. */
export function excludeDeleted<T extends { status: ProfessionStatus }>(
  rows: readonly T[],
): T[] {
  return rows.filter((r) => r.status !== "deleted");
}

/**
 * Validate one import row in isolation (empty name, slug shape, unknown
 * category). Cross-row duplicate detection is done by `findDuplicateIssues`.
 */
export function validateImportRow(
  row: ImportProfessionRow,
  rowIndex: number,
  knownCategorySlugs: ReadonlySet<string>,
): ImportIssue[] {
  const issues: ImportIssue[] = [];
  if (!row.professionName || row.professionName.trim().length === 0) {
    issues.push({ rowIndex, field: "professionName", code: "EMPTY_NAME", message: "Profession name must not be empty." });
  }
  if (row.professionSlug && !isValidSlug(row.professionSlug)) {
    issues.push({ rowIndex, field: "professionSlug", code: "INVALID_SLUG", message: `Invalid slug: ${row.professionSlug}` });
  }
  if (row.specializationSlug && !isValidSlug(row.specializationSlug)) {
    issues.push({ rowIndex, field: "specializationSlug", code: "INVALID_SLUG", message: `Invalid slug: ${row.specializationSlug}` });
  }
  // A specialization is optional, but if a row declares one its name must be non-empty.
  if (row.specializationName !== undefined && row.specializationName.trim().length === 0) {
    issues.push({ rowIndex, field: "specializationName", code: "EMPTY_NAME", message: "Specialization name must not be empty when provided." });
  }
  if (!knownCategorySlugs.has(row.categorySlug)) {
    issues.push({ rowIndex, field: "categorySlug", code: "UNKNOWN_CATEGORY", message: `Unknown category: ${row.categorySlug}` });
  }
  return issues;
}

/** Effective profession slug for a row (explicit, else normalized name). */
export function effectiveProfessionSlug(row: ImportProfessionRow): string {
  return row.professionSlug ?? normalizeSlug(row.professionName);
}

/** Effective specialization slug for a row, or null when the row has none. */
export function effectiveSpecializationSlug(row: ImportProfessionRow): string | null {
  if (!row.specializationName || row.specializationName.trim().length === 0) return null;
  return row.specializationSlug ?? normalizeSlug(row.specializationName);
}

/**
 * Cross-row duplicate detection.
 *
 * - Professions: deduped by effective slug + name (globally — a profession slug
 *   is unique across the whole dataset).
 * - Specializations: deduped PER PROFESSION, keyed `${professionSlug}::${specSlug}`.
 *   The SAME specialization slug under a DIFFERENT profession is allowed
 *   (e.g. "frontend" under both "programista" and "designer") — it is only a
 *   duplicate when it repeats within the same parent profession.
 */
export function findDuplicateIssues(rows: readonly ImportProfessionRow[]): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const seenSlug = new Map<string, number>();
  const seenName = new Map<string, number>();
  const seenSpec = new Map<string, number>();
  rows.forEach((row, rowIndex) => {
    const slug = effectiveProfessionSlug(row);
    const name = row.professionName.trim().toLowerCase();
    if (seenSlug.has(slug)) {
      issues.push({ rowIndex, field: "professionSlug", code: "DUPLICATE_SLUG", message: `Duplicate slug: ${slug} (first seen row ${seenSlug.get(slug)})` });
    } else {
      seenSlug.set(slug, rowIndex);
    }
    if (name.length > 0 && seenName.has(name)) {
      issues.push({ rowIndex, field: "professionName", code: "DUPLICATE_NAME", message: `Duplicate name: ${row.professionName}` });
    } else if (name.length > 0) {
      seenName.set(name, rowIndex);
    }
    const specSlug = effectiveSpecializationSlug(row);
    if (specSlug) {
      const key = `${slug}::${specSlug}`;
      if (seenSpec.has(key)) {
        issues.push({ rowIndex, field: "specializationSlug", code: "DUPLICATE_SLUG", message: `Duplicate specialization "${specSlug}" within profession "${slug}" (first seen row ${seenSpec.get(key)})` });
      } else {
        seenSpec.set(key, rowIndex);
      }
    }
  });
  return issues;
}
