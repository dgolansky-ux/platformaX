/**
 * The 30 V2 profession categories. The data is the single source of truth in
 * `@shared/contracts/professions-categories` (so the frontend feature adapter
 * can read the same list without importing `@server/*`); this seed file is the
 * domain-side entry point and simply re-exports it.
 */
export {
  PROFESSION_CATEGORY_SEED,
  type ProfessionCategorySeed,
} from "@shared/contracts/professions-categories";
