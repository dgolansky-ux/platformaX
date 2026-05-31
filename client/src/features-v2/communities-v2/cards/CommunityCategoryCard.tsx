/**
 * features-v2/communities-v2/cards / CommunityCategoryCard — Slice 20B-FIX.
 *
 * Premium category tile (≥100px). Active state pulls brand color + tint;
 * hover lifts and tints lightly. Used by the "Odkryj społeczności" grid.
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
      className={`${styles.categoryTile} ${isActive ? styles.categoryTileActive : ""}`}
      onClick={() => onSelect(category.slug)}
      aria-pressed={isActive}
    >
      <span className={styles.categoryEmoji} aria-hidden="true">{category.emoji}</span>
      <span className={styles.categoryName}>{category.name}</span>
    </button>
  );
}
