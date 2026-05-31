/**
 * identity / professions — in-memory reference-data adapter.
 *
 * Categories are seeded from `profession-categories.seed.ts`. Profession and
 * specialization stores are intentionally EMPTY: the owner ships the full
 * dataset later through the import pipeline. No DB, no Supabase, no fake rows.
 */
import { excludeDeleted, sortByOrder } from "./policy";
import { PROFESSION_CATEGORY_SEED } from "./seeds/profession-categories.seed";
import type {
  ProfessionCategoryRecord,
  ProfessionRecord,
  ProfessionsReferenceRepository,
  SpecializationRecord,
} from "./contracts";

export function createInMemoryProfessionsRepository(): ProfessionsReferenceRepository {
  const categories: ProfessionCategoryRecord[] = sortByOrder(
    PROFESSION_CATEGORY_SEED.map((c) => ({
      id: c.slug,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      order: c.order,
      status: "active" as const,
    })),
  );
  // DATA_PENDING: the owner imports these later. Empty by design — not faked.
  const professions: ProfessionRecord[] = [];
  const specializations: SpecializationRecord[] = [];

  return {
    async listCategories() {
      return sortByOrder(excludeDeleted(categories)) as ProfessionCategoryRecord[];
    },
    async hasProfessionData() {
      return professions.length > 0;
    },
    async hasSpecializationData() {
      return specializations.length > 0;
    },
    async listProfessions(categorySlug) {
      const active = excludeDeleted(professions);
      return categorySlug ? active.filter((p) => p.categorySlug === categorySlug) : active;
    },
    async listSpecializations(professionSlug) {
      return excludeDeleted(specializations).filter((s) => s.professionSlug === professionSlug);
    },
  };
}
