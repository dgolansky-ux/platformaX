/**
 * features-v2/identity/professional-section / reference-adapter — the
 * MOCK_LOCAL_ONLY data source for the professional section.
 *
 * Categories come from the shared reference list (`@shared/contracts/
 * professions-categories`) — the SAME 30 rows the server domain seeds, so no
 * `@server/*` import and no drift. Professions + specializations are
 * DATA_PENDING: the adapter returns `{ state: "data_pending" }` honestly until
 * the owner imports the dataset. It never fabricates rows and never saves.
 */
import type {
  ProfessionCategoryDTO,
  ProfessionDTO,
  ReferenceDataResult,
  SpecializationDTO,
} from "@shared/contracts/professions";
import { PROFESSION_CATEGORY_SEED } from "@shared/contracts/professions-categories";

export type ProfessionalSectionAdapter = {
  listCategories(): Promise<ProfessionCategoryDTO[]>;
  searchProfessions(categorySlug: string): Promise<ReferenceDataResult<ProfessionDTO>>;
  listSpecializations(professionSlug: string): Promise<ReferenceDataResult<SpecializationDTO>>;
};

export const professionalSectionAdapter: ProfessionalSectionAdapter = {
  async listCategories() {
    return [...PROFESSION_CATEGORY_SEED]
      .sort((a, b) => a.order - b.order)
      .map((c) => ({
        id: c.slug,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        order: c.order,
        status: "active" as const,
      }));
  },
  // DATA_PENDING — honest empty signal, never a faked list.
  async searchProfessions() {
    return { state: "data_pending" };
  },
  async listSpecializations() {
    return { state: "data_pending" };
  },
};
