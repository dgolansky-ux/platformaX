/**
 * features-v2/communities-v2/cards / MyCommunityCard — Slice 20B-FIX top-tier.
 *
 * Clean tile for "Moje społeczności" grid. Brand-gradient monogram avatar,
 * member count + role meta, chevron tail that animates on hover.
 */
import { Link } from "react-router-dom";
import type { CommunityCardDTO } from "@shared/contracts/communities";
import styles from "./Cards.module.css";

type MyCommunityCardProps = {
  community: CommunityCardDTO;
};

function roleLabel(rel: CommunityCardDTO["viewerRelation"]): string | null {
  if (rel === "founder") return "Founder";
  if (rel === "admin") return "Admin";
  if (rel === "moderator") return "Moderator";
  if (rel === "member") return "Członek";
  return null;
}

export function MyCommunityCard({ community }: MyCommunityCardProps) {
  const initial = community.name.charAt(0).toUpperCase() || "•";
  const isFounder = community.viewerRelation === "founder";
  const role = roleLabel(community.viewerRelation);
  return (
    <Link to={`/communities/${community.slug}`} className={styles.myCard} aria-label={`Otwórz ${community.name}`}>
      <div className={styles.myAvatarWrap}>
        <div className={styles.myAvatar}>{initial}</div>
      </div>
      <div className={styles.myBody}>
        <div className={styles.myTitleRow}>
          <span className={styles.myTitle}>{community.name}</span>
          {isFounder ? <span className={styles.crown} aria-label="Założyciel">👑</span> : null}
        </div>
        <div className={styles.myMeta}>
          <span className={styles.dotGreen} aria-hidden="true" />
          <span>{community.memberCount.toLocaleString("pl-PL")} {community.memberCount === 1 ? "członek" : "członków"}</span>
          {role && !isFounder ? (
            <>
              <span className={styles.metaDivider} aria-hidden="true" />
              <span>{role}</span>
            </>
          ) : null}
        </div>
      </div>
      <span className={styles.chevron} aria-hidden="true">→</span>
    </Link>
  );
}
