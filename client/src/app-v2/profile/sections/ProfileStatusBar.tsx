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
          <span className={styles.statusMeta} aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </span>
          {status.visibility === "friends" ? (
            <span className={styles.statusMeta} aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </span>
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
        <span className={styles.statusPhotoIcon} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
        <span style={{ fontSize: "9px" }}>foto</span>
      </button>
    </div>
  );
}
