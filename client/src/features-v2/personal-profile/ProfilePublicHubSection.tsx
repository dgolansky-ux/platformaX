import type { PersonalProfileViewDTO } from "@shared/contracts/personal-profile-view";
import styles from "./PersonalProfilePage.module.css";

const MODULE_LABEL: Record<string, string> = {
  topics: "Tematy",
  events: "Wydarzenia",
  newsletter: "Newsletter",
  integrations: "Integracje",
};

type Props = {
  view: PersonalProfileViewDTO;
  onManageModules?: () => void;
};

export function ProfilePublicHubSection({ view, onManageModules }: Props) {
  if (!view.viewerState.canViewPublicHub) return null;
  const hub = view.publicHub;
  const visibleModules = hub.modules.filter((m) => m.enabled || hub.canManageModules);
  return (
    <section className={styles.section} aria-labelledby="profile-hub-heading">
      <header className={styles.sectionHeader}>
        <h2 id="profile-hub-heading" className={styles.sectionTitle}>Public Hub</h2>
        {hub.canManageModules && onManageModules ? (
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onManageModules}>
            Zarządzaj modułami
          </button>
        ) : null}
      </header>
      {visibleModules.length === 0 ? (
        <p className={styles.empty}>Ten profil nie ma jeszcze publicznych modułów.</p>
      ) : (
        <div className={styles.hubGrid}>
          {visibleModules.map((m) => (
            <article key={m.key} className={styles.hubCard}>
              <span className={styles.hubKey}>{MODULE_LABEL[m.key] ?? m.key}</span>
              <span className={styles.hubStatus}>{m.enabled ? "Włączony" : "Wyłączony"}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
