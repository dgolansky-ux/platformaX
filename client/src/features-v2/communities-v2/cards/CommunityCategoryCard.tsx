/**
 * features-v2/communities-v2/cards / CommunityCategoryCard — 76×76 chip from the
 * legacy „Odkryj społeczności" grid: emoji + name + selected state.
 */
import type { CommunityCategoryDTO } from "@shared/contracts/communities";
import styles from "./Cards.module.css";

type CommunityCategoryCardProps = {
  category: CommunityCategoryDTO;
  isActive?: boolean;
  onSelect: (slug: string) => void;
};

export function CommunityCategoryCard({ category, isActive, onSelect }: CommunityCategoryCardProps) {
  return (
    <button
      type="button"
      className={`${styles.categoryChip} ${isActive ? styles.categoryChipActive : ""}`}
      onClick={() => onSelect(category.slug)}
      aria-pressed={isActive}
    >
      <span className={styles.categoryEmoji} aria-hidden="true">{category.emoji}</span>
      <span className={styles.categoryName}>{category.name}</span>
    </button>
  );
}
