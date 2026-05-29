/**
 * features-v2/communities-v2/sections / CategoriesSection — grid kategorii
 * z legacy „Odkryj społeczności" (76×76 chipy z emoji + nazwą).
 */
import type { CommunityCategoryDTO } from "@shared/contracts/communities";
import { CommunityCategoryCard } from "../cards/CommunityCategoryCard";
import sections from "./Sections.module.css";

type CategoriesSectionProps = {
  categories: readonly CommunityCategoryDTO[];
  activeSlug: string | null;
  onSelect: (slug: string) => void;
};

export function CategoriesSection({ categories, activeSlug, onSelect }: CategoriesSectionProps) {
  return (
    <section className={sections.section} aria-label="Odkryj społeczności">
      <div className={sections.sectionHeader}>
        <h2 className={sections.sectionTitle}>Odkryj społeczności</h2>
      </div>
      <p className={sections.sectionSubtitle}>Wybierz kategorię, aby przeglądać publiczne społeczności</p>
      {categories.length === 0 ? (
        <div className={sections.searchEmpty}>
          <span className={sections.searchEmptyIcon} aria-hidden="true">🏙</span>
          <p>Ładowanie kategorii…</p>
        </div>
      ) : (
        <div className={sections.categoryGrid}>
          {categories.map((cat) => (
            <CommunityCategoryCard
              key={cat.slug}
              category={cat}
              isActive={activeSlug === cat.slug}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}
