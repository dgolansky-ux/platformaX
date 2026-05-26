import type { CSSProperties } from "react";
import styles from "../styles/profile-header.module.css";
import media from "../styles/profile-media.module.css";

type ProfileBannerProps = {
  onShare: () => void;
  isOwner?: boolean;
  onEditImage?: () => void;
  /** Optional banner URL resolved through the media boundary. Falls back to gradient. */
  bannerUrl?: string | null;
};

/** Gradient banner. Share is a real action; owners get a local upload sheet. */
export function ProfileBanner({
  onShare,
  isOwner,
  onEditImage,
  bannerUrl = null,
}: ProfileBannerProps) {
  const style: CSSProperties = bannerUrl
    ? {
        backgroundImage: `url(${bannerUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};
  return (
    <div className={styles.banner} aria-label="Baner profilu" style={style}>
      {isOwner && onEditImage ? (
        <button
          type="button"
          className={media.bannerEdit}
          aria-label="Zmień baner"
          onClick={onEditImage}
        >
          📷
        </button>
      ) : null}
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
