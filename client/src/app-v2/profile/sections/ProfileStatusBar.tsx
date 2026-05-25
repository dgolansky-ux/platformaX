import type { ProfileStatus } from "../types";
import styles from "../styles/profile-status.module.css";

type ProfileStatusBarProps = {
  status: ProfileStatus | null;
  isOwner: boolean;
};

/**
 * Status pill + status photo. Pill colors and animations mirror legacy
 * ProfileHeaderStatusBar (sparkle + shake when empty, ph-dot pulse when set).
 * Status photo upload is disabled — media runtime not connected.
 */
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
          <span className={styles.statusEmoji} aria-hidden="true">
            {status.emoji}
          </span>
          <span className={styles.statusTexts}>
            <span className={styles.statusState}>{status.state}</span>
            {status.description ? (
              <span className={styles.statusDesc}>{status.description}</span>
            ) : null}
          </span>
          <span className={styles.statusMeta} aria-hidden="true">✏️</span>
          {status.visibility === "friends" ? (
            <span className={styles.statusMeta} aria-hidden="true">👥</span>
          ) : null}
        </button>
      ) : (
        <button
          type="button"
          className={`${styles.statusPill} ${styles.statusPillEmpty}`}
          aria-label="Ustaw status"
          disabled={!isOwner}
        >
          <span className={styles.statusSparkle} aria-hidden="true">✶</span>
          <span className={styles.statusEmptyLabel}>Ustaw swój status...</span>
        </button>
      )}

      <button
        type="button"
        className={styles.statusPhoto}
        aria-label="Zdjęcie statusowe — wkrótce"
        title="Zdjęcie statusowe będzie dostępne po podłączeniu media"
        disabled
      >
        <span className={styles.statusPhotoIcon} aria-hidden="true">📷</span>
        <span>foto</span>
      </button>
    </div>
  );
}
