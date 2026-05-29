/**
 * features-v2/communities-v2/cards / MyCommunityCard — legacy "Moje społeczności"
 * row variant. Avatar with orbit ring, pulse-green dot, ChevronRight tail.
 *
 * Pure presentational. Data comes from `CommunityCardDTO` (no PII).
 */
import { Link } from "react-router-dom";
import type { CommunityCardDTO } from "@shared/contracts/communities";
import styles from "./Cards.module.css";

type MyCommunityCardProps = {
  community: CommunityCardDTO;
};

export function MyCommunityCard({ community }: MyCommunityCardProps) {
  const initial = community.name.charAt(0).toUpperCase() || "•";
  const isFounder = community.viewerRelation === "founder";
  return (
    <Link to={`/communities/${community.slug}`} className={styles.myRow} aria-label={`Otwórz ${community.name}`}>
      <div className={styles.myAvatarWrap}>
        <svg width={52} height={52} className={styles.orbitRing} aria-hidden="true">
          <circle cx={26} cy={26} r={24} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} strokeDasharray="4 6" />
        </svg>
        <div className={styles.myAvatar}>{initial}</div>
      </div>
      <div className={styles.myBody}>
        <div className={styles.myTitleRow}>
          <span className={styles.myTitle}>{community.name.slice(0, 20)}</span>
          {isFounder ? <span className={styles.crown} aria-label="Założyciel">👑</span> : null}
        </div>
        <div className={styles.myMeta}>
          <span className={styles.dotGreen} aria-hidden="true" />
          <span>{community.memberCount.toLocaleString("pl-PL")} czł.</span>
        </div>
      </div>
      <span className={styles.chevron} aria-hidden="true">›</span>
    </Link>
  );
}
