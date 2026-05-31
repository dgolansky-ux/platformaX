import type { ReactElement } from "react";
import styles from "./ProfessionalSection.module.css";

/**
 * "Moje zawody" — the future slots (max 3: one primary + two additional).
 * Empty + disabled today: there is no profession dataset yet, so there is
 * nothing to save. No fake save, no fake rows.
 */
export function MyProfessionsPanel(): ReactElement {
  return (
    <section className={styles.panel} aria-label="Moje zawody">
      <h2 className={styles.sectionTitle}>Moje zawody</h2>
      <p className={styles.note}>
        Możesz wybrać maksymalnie 3 zawody — jeden główny i dwa dodatkowe.
        Zapis będzie możliwy po imporcie bazy zawodów.
      </p>
      <div className={styles.slots}>
        <div className={`${styles.slot} ${styles.slotPrimary}`}>
          <span className={styles.slotLabel}>Zawód główny</span>
          <span className={styles.slotEmpty}>Brak — dodasz po imporcie bazy</span>
        </div>
        <div className={styles.slot}>
          <span className={styles.slotLabel}>Dodatkowy 1</span>
          <span className={styles.slotEmpty}>Brak</span>
        </div>
        <div className={styles.slot}>
          <span className={styles.slotLabel}>Dodatkowy 2</span>
          <span className={styles.slotEmpty}>Brak</span>
        </div>
      </div>
      <button type="button" className={styles.button} disabled>
        Zapisz zawody (dostępne po imporcie)
      </button>
    </section>
  );
}
