/**
 * features-v2/communities-v2/cards / RecommendedCommunityCard — horizontal-scroll
 * variant from legacy „Polecane dla Ciebie". Compact (140×~120), gradient top,
 * inline „Dołącz" CTA when viewer is not a member.
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
  const gradient = GRADIENTS[(community.bannerGradientIdx ?? 0) % GRADIENTS.length];
  return (
    <article className={styles.recommendedCard}>
      <Link to={`/communities/${community.slug}`} className={styles.recommendedHead} style={{ background: gradient }} aria-label={`Otwórz ${community.name}`}>
        <span className={styles.recommendedEmoji} aria-hidden="true">{categoryEmoji ?? FALLBACK_EMOJI}</span>
      </Link>
      <div className={styles.recommendedBody}>
        <p className={styles.recommendedName} title={community.name}>{community.name}</p>
        <div className={styles.recommendedMeta}>
          <span className={styles.dotGreen} aria-hidden="true" />
          <span>{community.memberCount} czł.</span>
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

const GRADIENTS: readonly string[] = [
  "linear-gradient(135deg, #1e4fd8 0%, #7c3aed 50%, #ec4899 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%)",
  "linear-gradient(135deg, #14b8a6 0%, #3b82f6 50%, #8b5cf6 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)",
  "linear-gradient(135deg, #10b981 0%, #0ea5e9 50%, #6366f1 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%)",
];
