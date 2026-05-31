/**
 * identity / professions — reference-data service.
 *
 * Status: categories = REFERENCE_DATA_READY; professions + specializations =
 * DATA_PENDING. `searchProfessions` / `listSpecializations` return an honest
 * `{ state: "data_pending" }` until the owner imports the dataset — they
 * NEVER invent rows. `dryRunImport` validates a prospective package without
 * persisting anything.
 */
import type {
  ImportDryRunReport,
  ImportProfessionRow,
  ProfessionCategoryDTO,
  ProfessionDTO,
  ReferenceDataResult,
  SpecializationDTO,
} from "@shared/contracts/professions";
import type { ProfessionsReferenceRepository } from "./contracts";
import { sortByOrder } from "./policy";
import {
  toCategoryDTO,
  toProfessionDTO,
  toSpecializationDTO,
} from "./mapper";
import { dryRunImport } from "./import/professions-import.validator";

export type ProfessionsServiceDeps = { repo: ProfessionsReferenceRepository };

const DEFAULT_LIMIT = 50;

export interface ProfessionsService {
  /** All 30 reference categories, sorted by `order` ASC. */
  listCategories(): Promise<ProfessionCategoryDTO[]>;
  /** DATA_PENDING until the dataset is imported; then a paginated page. */
  searchProfessions(input: {
    query?: string;
    categorySlug?: string;
    cursor?: string | null;
    limit?: number;
  }): Promise<ReferenceDataResult<ProfessionDTO>>;
  /** DATA_PENDING until the dataset is imported; then a paginated page. */
  listSpecializations(input: {
    professionSlug: string;
    cursor?: string | null;
    limit?: number;
  }): Promise<ReferenceDataResult<SpecializationDTO>>;
  /** Validate-only import; never persists (`report.persisted === false`). */
  dryRunImport(rows: readonly ImportProfessionRow[]): Promise<ImportDryRunReport>;
}

// Callers MUST pass `items` already in a stable order (sorted by slug) so
// cursor offsets are deterministic across pages.
function paginate<T>(items: readonly T[], cursor: string | null | undefined, limit: number): {
  page: T[];
  nextCursor: string | null;
} {
  const start = cursor ? Number(cursor) || 0 : 0;
  const safeLimit = limit > 0 ? limit : DEFAULT_LIMIT;
  const page = items.slice(start, start + safeLimit);
  const nextStart = start + safeLimit;
  return { page, nextCursor: nextStart < items.length ? String(nextStart) : null };
}

export function createProfessionsService(deps: ProfessionsServiceDeps): ProfessionsService {
  return {
    async listCategories() {
      const records = await deps.repo.listCategories();
      return sortByOrder(records).map(toCategoryDTO);
    },

    async searchProfessions(input) {
      if (!(await deps.repo.hasProfessionData())) {
        return { state: "data_pending" };
      }
      const all = await deps.repo.listProfessions(input.categorySlug);
      const q = input.query?.trim().toLowerCase();
      const filtered = q ? all.filter((p) => p.name.toLowerCase().includes(q)) : all;
      const ordered = [...filtered].sort((a, b) => a.slug.localeCompare(b.slug));
      const { page, nextCursor } = paginate(ordered, input.cursor, input.limit ?? DEFAULT_LIMIT);
      return { state: "ready", items: page.map(toProfessionDTO), nextCursor };
    },

    async listSpecializations(input) {
      if (!(await deps.repo.hasSpecializationData())) {
        return { state: "data_pending" };
      }
      const all = await deps.repo.listSpecializations(input.professionSlug);
      const ordered = [...all].sort((a, b) => a.slug.localeCompare(b.slug));
      const { page, nextCursor } = paginate(ordered, input.cursor, input.limit ?? DEFAULT_LIMIT);
      return { state: "ready", items: page.map(toSpecializationDTO), nextCursor };
    },

    async dryRunImport(rows) {
      const categories = await deps.repo.listCategories();
      const knownCategorySlugs = new Set(categories.map((c) => c.slug));
      return dryRunImport(rows, knownCategorySlugs);
    },
  };
}
