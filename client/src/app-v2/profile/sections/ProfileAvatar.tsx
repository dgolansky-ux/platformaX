import styles from "../profile.module.css";

type ProfileAvatarProps = {
  initial: string;
  isOwner: boolean;
  previewOpen: boolean;
  onTogglePreview: () => void;
};

export function ProfileAvatar({
  initial,
  isOwner,
  previewOpen,
  onTogglePreview,
}: ProfileAvatarProps) {
  return (
    <div className={styles.avatar}>
      <div className={styles.avatarInner} aria-hidden="true">
        {initial}
      </div>
      {isOwner ? (
        <button
          type="button"
          className={styles.eyeButton}
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
