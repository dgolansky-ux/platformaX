import type { ProfileStatus } from "../types";
import styles from "../profile.module.css";

type ProfileStatusBarProps = {
  status: ProfileStatus | null;
  isOwner: boolean;
};

export function ProfileStatusBar({ status, isOwner }: ProfileStatusBarProps) {
  return (
    <div className={styles.statusBar}>
      {status ? (
        <button
          type="button"
          className={styles.statusPill}
          aria-label="Edytuj status"
          disabled={!isOwner}
        >
          <span className={styles.statusDot} aria-hidden="true" />
          <span className={styles.statusTexts}>
            <span className={styles.statusState}>
              {status.emoji} {status.state}
            </span>
            {status.description ? (
              <span className={styles.statusDesc}>{status.description}</span>
            ) : null}
          </span>
        </button>
      ) : (
        <button
          type="button"
          className={`${styles.statusPill} ${styles.statusPillEmpty}`}
          aria-label="Ustaw status"
          disabled={!isOwner}
        >
          <span aria-hidden="true">✶</span> Ustaw swój status...
        </button>
      )}

      {/* Status photo: media runtime not connected — upload is intentionally disabled. */}
      <button
        type="button"
        className={styles.statusPhoto}
        aria-label="Zdjęcie statusowe — wkrótce"
        title="Zdjęcie statusowe będzie dostępne po podłączeniu media"
        disabled
      >
        <span aria-hidden="true">📷</span>
        <span>foto</span>
      </button>
    </div>
  );
}
