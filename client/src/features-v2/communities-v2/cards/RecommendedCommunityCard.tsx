/**
 * features-v2/communities-v2/cards / RecommendedCommunityCard — Slice 20B-FIX.
 *
 * Premium carousel card for "Polecane dla Ciebie". Soft brand-tint header
 * (no harsh rainbow gradients), category emoji as the cover icon, name +
 * member count + optional "Dołącz" CTA.
 */
import { Link } from "react-router-dom";
import type { CommunityCardDTO } from "@shared/contracts/communities";
import styles from "./Cards.module.css";

type RecommendedCommunityCardProps = {
  community: CommunityCardDTO;
  categoryEmoji?: string;
  onJoin?: (slug: string) => void;
};

const FALLBACK_EMOJI = "🌍";

export function RecommendedCommunityCard({ community, categoryEmoji, onJoin }: RecommendedCommunityCardProps) {
  const isMember = community.viewerRelation && community.viewerRelation !== "not_member" && community.viewerRelation !== "requested";
  const tint = TINTS[(community.bannerGradientIdx ?? 0) % TINTS.length];
  return (
    <article className={styles.recommendedCard}>
      <Link
        to={`/communities/${community.slug}`}
        className={styles.recommendedHead}
        style={{ background: tint }}
        aria-label={`Otwórz ${community.name}`}
      >
        <span className={styles.recommendedEmoji} aria-hidden="true">{categoryEmoji ?? FALLBACK_EMOJI}</span>
      </Link>
      <div className={styles.recommendedBody}>
        <p className={styles.recommendedName} title={community.name}>{community.name}</p>
        <div className={styles.recommendedMeta}>
          <span className={styles.dotGreen} aria-hidden="true" />
          <span>{community.memberCount.toLocaleString("pl-PL")} czł.</span>
        </div>
        {!isMember && onJoin ? (
          <button
            type="button"
            className={styles.recommendedJoin}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onJoin(community.slug);
            }}
          >
            Dołącz
          </button>
        ) : null}
      </div>
    </article>
  );
}

const TINTS: readonly string[] = [
  "linear-gradient(135deg, #eef0ff 0%, #f3edff 100%)",
  "linear-gradient(135deg, #e6f7ee 0%, #eef0ff 100%)",
  "linear-gradient(135deg, #fff3df 0%, #fde9eb 100%)",
  "linear-gradient(135deg, #e0f2fe 0%, #f3edff 100%)",
  "linear-gradient(135deg, #f3edff 0%, #ffe4f4 100%)",
  "linear-gradient(135deg, #eaf7ff 0%, #e6f7ee 100%)",
];
