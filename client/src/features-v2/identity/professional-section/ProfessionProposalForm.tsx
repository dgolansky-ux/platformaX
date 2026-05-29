import { useState, type ReactElement } from "react";
import styles from "./ProfessionalSection.module.css";

/**
 * "Nie znalazłem swojego zawodu — dodaj nowy". Local draft only: there is no
 * runtime proposal store yet, so the field is editable but the submit is
 * disabled (no fake save, no native alert dialogs). When the backend proposal
 * store ships, the same form wires to the identity service.
 */
export function ProfessionProposalForm({
  categoryName,
}: {
  categoryName: string;
}): ReactElement {
  const [draft, setDraft] = useState("");
  return (
    <section className={styles.panel} aria-label="Zaproponuj nowy zawód">
      <h2 className={styles.sectionTitle}>Nie znalazłeś swojego zawodu?</h2>
      <p className={styles.note}>
        Zaproponuj nowy zawód w kategorii „{categoryName}”. Propozycja trafi do
        moderacji po uruchomieniu zaplecza — na razie to lokalny szkic.
      </p>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Nazwa zawodu</span>
        <input
          className={styles.input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="np. Inżynier dźwięku"
          aria-label="Proponowana nazwa zawodu"
        />
      </label>
      <button type="button" className={styles.button} disabled>
        Wyślij propozycję (dostępne po uruchomieniu moderacji)
      </button>
      <p className={styles.note}>
        Status: SKELETON_ONLY — propozycje zawodów nie są jeszcze zapisywane.
      </p>
    </section>
  );
}
