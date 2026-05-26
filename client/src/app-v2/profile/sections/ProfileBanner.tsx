import type { CSSProperties } from "react";
import styles from "../styles/profile-header.module.css";
import skeleton from "../styles/profile-banner-skeleton.module.css";
import media from "../styles/profile-media.module.css";

type ProfileBannerProps = {
  onShare: () => void;
  isOwner?: boolean;
  onEditImage?: () => void;
  /** Optional banner URL resolved through the media boundary. Falls back to gradient. */
  bannerUrl?: string | null;
  /** Optional share count rendered in the corner badge (design pass shows "52"). */
  shareCount?: number;
};

/**
 * Profile banner. Falls back to the gradient skeleton when no media URL is
 * resolved, with chart-placeholder cells inside (2x2 grid: lines + line chart
 * on top, bar chart + list rows below) per the design pass screenshot. Share
 * is a real action with a numeric count badge in the top-right corner; owners
 * also get a local upload sheet anchored to the banner.
 */
export function ProfileBanner({
  onShare,
  isOwner,
  onEditImage,
  bannerUrl = null,
  shareCount = 52,
}: ProfileBannerProps) {
  const style: CSSProperties = bannerUrl
    ? {
        backgroundImage: `url(${bannerUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};

  const shareLabel = `Udostępnij profil (${shareCount} udostępnień)`;

  return (
    <div className={styles.banner} aria-label="Baner profilu" style={style}>
      {bannerUrl ? null : (
        <div className={skeleton.bannerSkeleton} aria-hidden="true">
          <div className={`${skeleton.bannerCell} ${skeleton.bannerCellLines}`}>
            <span /> <span /> <span /> <span />
          </div>
          <div className={`${skeleton.bannerCell} ${skeleton.bannerCellChart}`}>
            <svg
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              className={skeleton.bannerChartSvg}
              aria-hidden="true"
            >
              <polyline
                points="2,30 22,22 42,12 58,18 78,8 98,14"
                fill="none"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="58" cy="18" r="2.4" fill="#fff" />
            </svg>
          </div>
          <div className={`${skeleton.bannerCell} ${skeleton.bannerCellBars}`}>
            <span /> <span /> <span />
          </div>
          <div className={`${skeleton.bannerCell} ${skeleton.bannerCellList}`}>
            <span /> <span />
          </div>
        </div>
      )}
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
        aria-label={shareLabel}
        onClick={onShare}
      >
        <span className={skeleton.bannerShareIcon} aria-hidden="true">↗</span>
        <span className={skeleton.bannerShareCount}>{shareCount}</span>
      </button>
    </div>
  );
}
