import styles from "../profile.module.css";

type ProfessionBlockProps = {
  isOwner: boolean;
};

/**
 * Professional layer — profession block. No profession reference data exists yet
 * (PROFESSIONS_DATA_PENDING / SPECIALIZATIONS_DATA_PENDING), so this renders the
 * blueprint empty "Dodaj zawód" card (§21.2). Adding a profession needs the
 * profession editor (later PR), so the CTA is a disabled-policy state.
 */
export function ProfessionBlock({ isOwner }: ProfessionBlockProps) {
  return (
    <section className={styles.section} aria-label="Zawód">
      <div className={styles.professionEmpty}>
        <div className={styles.professionEmptyIcon} aria-hidden="true">
          💼
        </div>
        <div className={styles.professionEmptyBody}>
          <p className={styles.emptyTitle}>Dodaj zawód</p>
          <p className={styles.emptyText}>
            Uzupełnij profil zawodowy aby być znajdowanym
          </p>
        </div>
        {isOwner ? (
          <button
            type="button"
            className={styles.professionAddButton}
            title="Edytor zawodów będzie dostępny w kolejnym etapie"
            disabled
          >
            Dodaj
          </button>
        ) : null}
      </div>
    </section>
  );
}
