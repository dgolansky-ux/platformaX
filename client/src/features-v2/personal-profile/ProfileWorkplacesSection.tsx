import type { PersonalProfileViewDTO } from "@shared/contracts/personal-profile-view";
import styles from "./PersonalProfilePage.module.css";

const VIS_LABEL: Record<string, string> = {
  public: "Publiczne",
  friends_only: "Tylko znajomi",
  private: "Tylko Ty",
};

type Props = {
  view: PersonalProfileViewDTO;
  onAddWorkplace?: () => void;
};

export function ProfileWorkplacesSection({ view, onAddWorkplace }: Props) {
  if (!view.viewerState.canViewWorkplaces) return null;
  const preview = view.workplacesPreview;
  return (
    <section className={styles.section} aria-labelledby="profile-workplaces-heading">
      <header className={styles.sectionHeader}>
        <h2 id="profile-workplaces-heading" className={styles.sectionTitle}>Miejsca pracy</h2>
        {preview.canAddWorkplace && onAddWorkplace ? (
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onAddWorkplace}>
            Dodaj miejsce pracy
          </button>
        ) : null}
      </header>
      {preview.items.length === 0 ? (
        <p className={styles.empty}>
          {view.viewerState.canEditProfile
            ? "Jeszcze nie dodałeś miejsca pracy."
            : "Ten profil nie ma jeszcze publicznych miejsc pracy."}
        </p>
      ) : (
        <div className={styles.workplaceGrid}>
          {preview.items.map((w) => (
            <article key={w.workplaceId} className={styles.workplaceCard}>
              <h3 className={styles.workplaceTitle}>{w.name}</h3>
              <p className={styles.workplaceHeadline}>{w.headline}</p>
              <span className={styles.visibilityChip}>{VIS_LABEL[w.visibility] ?? w.visibility}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
