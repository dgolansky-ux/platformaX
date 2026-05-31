/**
 * identity / professions — internal contracts (records + repository port).
 * The public, cross-boundary DTOs live in `@shared/contracts/professions`;
 * these record/port types never leave the domain.
 */
import type { ProfessionStatus } from "@shared/contracts/professions";

/** Stored category record. `status` is always "active" for seeded reference data. */
export type ProfessionCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  order: number;
  status: "active";
};

/** Future record shape for imported professions (no rows seeded today). */
export type ProfessionRecord = {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  status: ProfessionStatus;
};

/** Future record shape for imported specializations (no rows seeded today). */
export type SpecializationRecord = {
  id: string;
  name: string;
  slug: string;
  professionSlug: string;
  status: ProfessionStatus;
};

/**
 * Reference-data port. The in-memory adapter ships seeded categories and
 * EMPTY profession/specialization stores; `hasProfessionData` /
 * `hasSpecializationData` are how the service decides DATA_PENDING vs ready —
 * it never fakes rows.
 */
export interface ProfessionsReferenceRepository {
  listCategories(): Promise<ProfessionCategoryRecord[]>;
  hasProfessionData(): Promise<boolean>;
  hasSpecializationData(): Promise<boolean>;
  listProfessions(categorySlug?: string): Promise<ProfessionRecord[]>;
  listSpecializations(professionSlug: string): Promise<SpecializationRecord[]>;
}
