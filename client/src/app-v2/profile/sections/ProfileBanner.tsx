import styles from "../profile.module.css";

type ProfileBannerProps = {
  onShare: () => void;
};

/** Empty gradient banner (no image upload in this shell). Share is a real action. */
export function ProfileBanner({ onShare }: ProfileBannerProps) {
  return (
    <div className={styles.banner} aria-label="Baner profilu">
      <button
        type="button"
        className={styles.bannerShare}
        aria-label="Udostępnij profil"
        onClick={onShare}
      >
        ↗
      </button>
    </div>
  );
}
