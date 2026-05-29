/**
 * features-v2/communities-v2 / feeds / CommunityFeedItemCard — one post in a
 * community feed. Shows author (public summary), body, date, feed badge and
 * the distribution trace ("Opublikowano z: {źródło}") for items pushed down
 * from an ancestor community. Slice 6 adds the interactions panel under the
 * card: reaction toggle + lazy comments thread. No fake counters, no PII.
 */
import type { CommunityFeedItemDTO } from "@shared/contracts/community-feeds";
import { CommunityPostInteractions } from "./interactions/CommunityPostInteractions";
import styles from "./Feeds.module.css";

const FEED_BADGE: Record<CommunityFeedItemDTO["feedType"], { label: string; cls: string }> = {
  community_all: { label: "Główny", cls: "badgeMain" },
  relational: { label: "Relacyjny", cls: "badgeRel" },
  staff_only: { label: "Kadra", cls: "badgeStaff" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

type Props = {
  item: CommunityFeedItemDTO;
  canComment: boolean;
  canReact: boolean;
  noPermissionMessage?: string;
};

export function CommunityFeedItemCard({ item, canComment, canReact, noPermissionMessage }: Props) {
  const badge = FEED_BADGE[item.feedType];
  return (
    <article className={styles.card} data-testid={`feed-item-${item.id}`}>
      <div className={styles.cardHead}>
        <span className={styles.avatar} aria-hidden="true">{item.authorDisplayName.charAt(0).toUpperCase()}</span>
        <div>
          <p className={styles.cardAuthor}>{item.authorDisplayName}</p>
          <p className={styles.cardDate}>{formatDate(item.createdAt)}</p>
        </div>
      </div>
      <p className={styles.cardBody}>{item.body}</p>
      <div className={styles.badges}>
        <span className={`${styles.badge} ${styles[badge.cls]}`}>{badge.label}</span>
        {item.isDistributed && item.sourceCommunityName ? (
          <span className={`${styles.badge} ${styles.badgeTrace}`}>Opublikowano z: {item.sourceCommunityName}</span>
        ) : null}
      </div>
      <CommunityPostInteractions
        item={item}
        canComment={canComment}
        canReact={canReact}
        noPermissionMessage={noPermissionMessage}
      />
    </article>
  );
}
