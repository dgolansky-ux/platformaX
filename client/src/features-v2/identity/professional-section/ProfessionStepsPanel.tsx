import type { ReactElement } from "react";
import type { ProfessionCategoryDTO } from "@shared/contracts/professions";
import styles from "./ProfessionalSection.module.css";

/**
 * Shown after a category is picked. Steps 2 (profession) and 3
 * (specialization) are DATA_PENDING — a truthful message, never a fake list.
 */
export function ProfessionStepsPanel({
  category,
}: {
  category: ProfessionCategoryDTO;
}): ReactElement {
  return (
    <section className={styles.panel} aria-label={`Wybrana kategoria: ${category.name}`}>
      <div className={styles.selectedHead}>
        <span className={styles.selectedIcon} aria-hidden="true">
          {category.icon}
        </span>
        <h2 className={styles.selectedName}>{category.name}</h2>
      </div>

      <div className={styles.steps}>
        <div className={styles.step}>
          <span className={styles.stepBadge}>1</span>
          <div className={styles.stepBody}>
            <p className={styles.stepName}>Kategoria wybrana</p>
            <p className={styles.stepHint}>{category.name}</p>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepBadge}>2</span>
          <div className={styles.stepBody}>
            <p className={styles.stepName}>Wybór zawodu</p>
            <p className={styles.stepHint}>
              Zawody dla tej kategorii zostaną dodane po imporcie pełnej bazy.
            </p>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepBadge}>3</span>
          <div className={styles.stepBody}>
            <p className={styles.stepName}>Wybór specjalizacji</p>
            <p className={styles.stepHint}>
              Specjalizacje pojawią się razem z zawodami po imporcie bazy.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.pendingBox}>
        Zawody i specjalizacje dla kategorii „{category.name}” zostaną dodane po
        imporcie pełnej bazy. Nie pokazujemy tu tymczasowych ani zmyślonych
        danych.
      </div>
    </section>
  );
}
