import type { ProfileStatus } from "../types";
import styles from "../styles/profile-status.module.css";

type ProfileStatusBarProps = {
  status: ProfileStatus | null;
  isOwner: boolean;
};

const STATUS_PILL_HINT =
  "Edycja statusu (emoji/dostępność/widoczność) wymaga rozszerzenia DTO identity (blueprint §10) i pojawi się w kolejnym etapie";

/**
 * Status pill + status photo. Pill colors and animations mirror legacy
 * ProfileHeaderStatusBar (sparkle + shake when empty, ph-dot pulse when set).
 * The pill itself is a disabled-policy CTA for all viewers — status emoji /
 * availability / visibility DTO is not wired yet (blueprint §10). The status
 * photo upload stays disabled until media runtime upgrades from upload-intent
 * to confirmed assets.
 */
export function ProfileStatusBar({ status, isOwner }: ProfileStatusBarProps) {
  return (
    <div className={styles.statusBar}>
      {status ? (
        <button
          type="button"
          className={styles.statusPill}
          aria-label={isOwner ? "Edytuj status — wkrótce" : "Status użytkownika"}
          title={isOwner ? STATUS_PILL_HINT : undefined}
          disabled
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
          aria-label={isOwner ? "Ustaw status — wkrótce" : "Brak statusu"}
          title={isOwner ? STATUS_PILL_HINT : undefined}
          disabled
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
