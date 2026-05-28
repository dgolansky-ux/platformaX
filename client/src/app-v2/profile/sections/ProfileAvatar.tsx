import styles from "../styles/profile-header.module.css";
import media from "../styles/profile-media.module.css";

type ProfileAvatarProps = {
  initial: string;
  /** Optional avatar URL resolved through the media boundary. Falls back to the initial. */
  avatarUrl?: string | null;
  /**
   * True only for authenticated owner. Anonymous/loading must pass false even
   * when the fixture has `isOwner: true`. Controls activation of the edit
   * button and the preview menu (owner-only affordances).
   */
  canEdit: boolean;
  previewOpen: boolean;
  onTogglePreview?: () => void;
  onEdit?: () => void;
};

/**
 * Mobile avatar. Mirrors legacy ProfileHeaderAvatar 1:1:
 * 144x144 white outer padding 3px → gradient ring 3px → inner #EFF6FF surface
 * with the user's initial (or media URL when present). Eye button below toggles
 * preview menu.
 */
export function ProfileAvatar({
  initial,
  avatarUrl = null,
  canEdit,
  previewOpen,
  onTogglePreview,
  onEdit,
}: ProfileAvatarProps) {
  return (
    <div className={styles.avatarWrap}>
      <div className={styles.avatar}>
        <div className={styles.avatarRing} aria-hidden="true">
          <div className={styles.avatarInner}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className={media.avatarImage}
                loading="lazy"
              />
            ) : (
              initial
            )}
          </div>
        </div>
        {canEdit && onEdit ? (
          <button
            type="button"
            className={media.avatarEditButton}
            aria-label="Zmień zdjęcie profilowe"
            onClick={onEdit}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        ) : null}
      </div>
      {canEdit && onTogglePreview ? (
        <button
          type="button"
          className={`${styles.eyeButton} ${previewOpen ? styles.eyeButtonActive : ""}`}
          aria-label="Podgląd profilu"
          aria-pressed={previewOpen}
          onClick={onTogglePreview}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
