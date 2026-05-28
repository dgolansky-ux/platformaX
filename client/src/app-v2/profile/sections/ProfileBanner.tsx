import type { CSSProperties } from "react";
import styles from "../styles/profile-header.module.css";
import skeleton from "../styles/profile-banner-skeleton.module.css";
import media from "../styles/profile-media.module.css";

type ProfileBannerProps = {
  onShare: () => void;
  /**
   * True only for authenticated owner viewing their own profile. Controls
   * activation of the banner edit button. Anonymous/loading must pass false.
   */
  canEdit?: boolean;
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
  canEdit,
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
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="58" cy="18" r="2" fill="rgba(255,255,255,0.3)" />
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
      {canEdit && onEditImage ? (
        <button
          type="button"
          className={media.bannerEdit}
          aria-label="Zmień baner"
          onClick={onEditImage}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
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
