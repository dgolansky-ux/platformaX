import type { ReactElement } from "react";
import type { ProfessionCategoryDTO } from "@shared/contracts/professions";
import styles from "./ProfessionalSection.module.css";

export function ProfessionCategoryGrid({
  categories,
  selectedSlug,
  onSelect,
}: {
  categories: readonly ProfessionCategoryDTO[];
  selectedSlug: string | null;
  onSelect: (category: ProfessionCategoryDTO) => void;
}): ReactElement {
  return (
    <div className={styles.grid} role="listbox" aria-label="Kategorie zawodowe">
      {categories.map((category) => {
        const selected = category.slug === selectedSlug;
        return (
          <button
            key={category.slug}
            type="button"
            role="option"
            aria-selected={selected}
            className={selected ? `${styles.card} ${styles.cardSelected}` : styles.card}
            onClick={() => onSelect(category)}
          >
            <span className={styles.cardIcon} aria-hidden="true">
              {category.icon}
            </span>
            <span className={styles.cardName}>{category.name}</span>
          </button>
        );
      })}
    </div>
  );
}
