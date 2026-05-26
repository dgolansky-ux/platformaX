import styles from "../styles/profile-header.module.css";
import media from "../styles/profile-media.module.css";

type ProfileAvatarProps = {
  initial: string;
  /** Optional avatar URL resolved through the media boundary. Falls back to the initial. */
  avatarUrl?: string | null;
  isOwner: boolean;
  previewOpen: boolean;
  onTogglePreview: () => void;
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
  isOwner,
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
        {isOwner && onEdit ? (
          <button
            type="button"
            className={media.avatarEditButton}
            aria-label="Zmień zdjęcie profilowe"
            onClick={onEdit}
          >
            📷
          </button>
        ) : null}
      </div>
      {isOwner ? (
        <button
          type="button"
          className={`${styles.eyeButton} ${previewOpen ? styles.eyeButtonActive : ""}`}
          aria-label="Podgląd profilu"
          aria-pressed={previewOpen}
          onClick={onTogglePreview}
        >
          👁
        </button>
      ) : null}
    </div>
  );
}
