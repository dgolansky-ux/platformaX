import sec from "../styles/profile-sections.module.css";
import pro from "../styles/profile-professional.module.css";

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
    <section className={sec.section} aria-label="Zawód">
      <div className={pro.professionEmpty}>
        <div className={pro.professionEmptyIcon} aria-hidden="true">
          💼
        </div>
        <div className={pro.professionEmptyBody}>
          <p className={sec.emptyTitle}>Dodaj zawód</p>
          <p className={sec.emptyText}>
            Uzupełnij profil zawodowy aby być znajdowanym
          </p>
        </div>
        {isOwner ? (
          <button
            type="button"
            className={pro.addButton}
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
