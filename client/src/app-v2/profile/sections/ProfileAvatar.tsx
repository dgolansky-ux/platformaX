import styles from "../styles/profile-header.module.css";

type ProfileAvatarProps = {
  initial: string;
  isOwner: boolean;
  previewOpen: boolean;
  onTogglePreview: () => void;
};

/**
 * Mobile avatar. Mirrors legacy ProfileHeaderAvatar 1:1:
 * 144x144 white outer padding 3px → gradient ring 3px → inner #EFF6FF surface
 * with the user's initial. Eye button below toggles preview menu.
 */
export function ProfileAvatar({
  initial,
  isOwner,
  previewOpen,
  onTogglePreview,
}: ProfileAvatarProps) {
  return (
    <div className={styles.avatarWrap}>
      <div className={styles.avatar}>
        <div className={styles.avatarRing} aria-hidden="true">
          <div className={styles.avatarInner}>{initial}</div>
        </div>
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
