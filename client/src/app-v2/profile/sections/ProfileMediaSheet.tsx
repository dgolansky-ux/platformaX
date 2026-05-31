import {
  AvatarUploader,
  BannerUploader,
  type MediaPurpose,
} from "../../../features-v2/media";
import styles from "../styles/profile-media.module.css";

type ProfileMediaSheetProps = {
  purpose: MediaPurpose;
  /** Owner of the asset. Placeholder until session wiring (step-33). */
  userId: string;
  /** Current saved avatar/banner URL, if any. */
  currentUrl?: string | null;
  onClose: () => void;
};

const TITLES: Partial<Record<MediaPurpose, string>> = {
  profile_avatar: "Zmień zdjęcie profilowe",
  profile_banner: "Zmień baner",
  profile_bio_media: "Zdjęcie statusowe",
};

/**
 * Local upload sheet for profile avatar/banner/bio media. Delegates to the
 * shared `AvatarUploader` / `BannerUploader` components from `features-v2/media`
 * so all surfaces use the same picker, validation and honest blocked state.
 */
export function ProfileMediaSheet({
  purpose,
  userId,
  currentUrl = null,
  onClose,
}: ProfileMediaSheetProps) {
  const title = TITLES[purpose] ?? "Edytuj media";
  const ownerRef = { ownerType: "user_profile" as const, ownerId: userId };

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} aria-label="Zamknij" onClick={onClose}>
            ×
          </button>
        </div>

        {purpose === "profile_banner" ? (
          <BannerUploader
            actorUserId={userId}
            ownerRef={ownerRef}
            purpose={purpose}
            currentUrl={currentUrl}
            label="Wybierz nowy baner"
          />
        ) : (
          <AvatarUploader
            actorUserId={userId}
            ownerRef={ownerRef}
            purpose={purpose}
            currentUrl={currentUrl}
            label={purpose === "profile_avatar" ? "Wybierz nowe zdjęcie" : "Wybierz zdjęcie"}
          />
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
