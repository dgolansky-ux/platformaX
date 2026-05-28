import type { ProfileStatus } from "../types";
import styles from "../styles/profile-status.module.css";

type ProfileStatusBarProps = {
  status: ProfileStatus | null;
  /** True only for authenticated owner. Controls owner edit affordances/labels. */
  canEdit: boolean;
};

const STATUS_PILL_HINT =
  "Edycja statusu (emoji/dostępność/widoczność) wymaga rozszerzenia DTO identity (blueprint §10) i pojawi się w kolejnym etapie";

/**
 * Civil status card rendered under the avatar in the left column.
 * Owner-only — hidden entirely for anonymous/loading/non-owner viewers.
 */
export function ProfileCivilCard({ canEdit }: { canEdit: boolean }) {
  if (!canEdit) return null;
  return (
    <button
      type="button"
      className={styles.civilCard}
      disabled
      title="Ustaw stan cywilny — wkrótce"
    >
      <span className={styles.civilIcon} aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      </span>
      Ustaw stan cywilny
    </button>
  );
}

/**
 * Status pill + status photo row. Rendered on the right side (bio column).
 */
export function ProfileStatusRow({ status, canEdit }: ProfileStatusBarProps) {
  return (
    <div className={styles.statusRow}>
      {status ? (
        <button
          type="button"
          className={styles.statusPill}
          aria-label={canEdit ? "Edytuj status — wkrótce" : "Status użytkownika"}
          title={canEdit ? STATUS_PILL_HINT : undefined}
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
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </span>
          {status.visibility === "friends" ? (
            <span className={styles.statusMeta} aria-hidden="true">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          aria-label={canEdit ? "Ustaw status — wkrótce" : "Brak statusu"}
          title={canEdit ? STATUS_PILL_HINT : undefined}
          disabled
        >
          <span className={styles.statusSparkle} aria-hidden="true">✶</span>
          <span className={styles.statusEmptyLabel}>Ustaw status...</span>
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
        <span>foto</span>
      </button>
    </div>
  );
}

/**
 * Combined status bar (civil card + status row). Kept for backward compat
 * with tests that import ProfileStatusBar.
 */
export function ProfileStatusBar({ status, canEdit }: ProfileStatusBarProps) {
  return (
    <div className={styles.statusBar}>
      <ProfileCivilCard canEdit={canEdit} />
      <ProfileStatusRow status={status} canEdit={canEdit} />
    </div>
  );
}
