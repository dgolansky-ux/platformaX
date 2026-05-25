import { useState } from "react";
import sec from "../styles/profile-sections.module.css";
import pro from "../styles/profile-professional.module.css";

type ProfileSpecialistsProps = {
  isOwner: boolean;
};

/**
 * Professional layer — specialists (§22). No specialist data yet, so this is
 * the empty state. Header mirrors legacy ProfileSpecialists 1:1: orange
 * briefcase icon + "{n} osób" subtitle + a real 40x22 visibility switch.
 * Local state only — not persisted (no backend), which is honest for a shell.
 */
export function ProfileSpecialists({ isOwner }: ProfileSpecialistsProps) {
  const [visible, setVisible] = useState(true);

  return (
    <section className={sec.section} aria-label="Specjaliści">
      <div className={sec.sectionHeader}>
        <div className={pro.specialistsHeader}>
          <span className={pro.specialistsIcon} aria-hidden="true">💼</span>
          <div className={pro.specialistsTitleBox}>
            <h2 className={pro.specialistsTitle}>Specjaliści</h2>
            <p className={pro.specialistsSubtitle}>0 osób</p>
          </div>
        </div>
        {isOwner ? (
          <div className={pro.specialistsVisibility}>
            <span className={pro.specialistsVisibilityLabel}>
              {visible ? "Widoczne" : "Ukryte"}
            </span>
            <button
              type="button"
              className={`${pro.specialistsToggle} ${visible ? pro.specialistsToggleOn : ""}`}
              aria-pressed={visible}
              aria-label={
                visible ? "Ukryj sekcję specjalistów" : "Pokaż sekcję specjalistów"
              }
              onClick={() => setVisible((v) => !v)}
            >
              <span className={pro.specialistsToggleKnob} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      <p className={sec.emptyInline}>
        {isOwner
          ? "Nie dodano jeszcze żadnych specjalistów"
          : "Brak specjalistów do wyświetlenia"}
      </p>
    </section>
  );
}
