import { useState } from "react";
import styles from "../profile.module.css";

type ProfileSpecialistsProps = {
  isOwner: boolean;
};

/**
 * Professional layer — specialists (§22). No specialist data yet, so this is the
 * empty state. The owner visibility toggle is real local UI state (Widoczne /
 * Ukryte) — not persisted (no backend), which is honest for a shell.
 */
export function ProfileSpecialists({ isOwner }: ProfileSpecialistsProps) {
  const [visible, setVisible] = useState(true);

  return (
    <section className={styles.section} aria-label="Specjaliści">
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Specjaliści</h2>
          <span className={styles.sectionSubtitle}>0 osób</span>
        </div>
        {isOwner ? (
          <button
            type="button"
            className={styles.specialistsToggle}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? "Widoczne" : "Ukryte"}
          </button>
        ) : null}
      </div>

      <p className={styles.contactsEmpty}>
        {isOwner
          ? "Nie dodano jeszcze żadnych specjalistów"
          : "Brak specjalistów do wyświetlenia"}
      </p>
    </section>
  );
}
