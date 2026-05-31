/**
 * features-v2/channels / ChannelCard — directory entry card.
 *
 * Variant is implicit: the parent section sets the section context, the card
 * picks badges from the DTO (viewerFollows / viewerIsLead) — no separate
 * "FollowedChannelCard" / "LeadingChannelCard" subclasses needed.
 */
import { useNavigate } from "react-router-dom";
import type { ChannelCardDTO } from "@shared/contracts/channels";
import styles from "./Channels.module.css";

type Props = { channel: ChannelCardDTO };

function followerLabel(count: number): string {
  if (count === 1) return "1 obserwujący";
  return `${count} obserwujących`;
}

function leadLabel(count: number): string {
  if (count === 1) return "1 prowadzący";
  return `${count} prowadzących`;
}

export function ChannelCard({ channel }: Props) {
  const navigate = useNavigate();
  const initial = channel.name.charAt(0).toUpperCase();
  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => navigate(`/channels/${channel.slug}`)}
      data-testid={`channel-card-${channel.slug}`}
      aria-label={`Otwórz kanał ${channel.name}`}
    >
      <div className={styles.cardHead}>
        <span className={styles.cardEmoji} aria-hidden="true">{initial}</span>
        <div className={styles.cardTitleBlock}>
          <p className={styles.cardName}>{channel.name}</p>
          <p className={styles.cardOwner}>{channel.owner.communityName}</p>
        </div>
      </div>
      {channel.description ? <p className={styles.cardDesc}>{channel.description}</p> : null}
      {channel.lastPostPreview ? <p className={styles.cardDesc}>Ostatnio: {channel.lastPostPreview}</p> : null}
      <div className={styles.cardMeta}>
        <div className={styles.cardMetaLeft}>
          <span><span className={styles.metaCount}>{channel.followerCount}</span> {followerLabel(channel.followerCount).replace(/^\d+\s/, "")}</span>
          <span className={styles.metaDot}>·</span>
          <span><span className={styles.metaCount}>{channel.leadCount}</span> {leadLabel(channel.leadCount).replace(/^\d+\s/, "")}</span>
          {typeof channel.postCount === "number" ? (
            <>
              <span className={styles.metaDot}>·</span>
              <span><span className={styles.metaCount}>{channel.postCount}</span> wpisów</span>
            </>
          ) : null}
        </div>
        <div>
          {channel.viewerLeadRole === "lead" ? <span className={`${styles.badge} ${styles.badgeLead}`}>Prowadzisz</span>
            : channel.viewerLeadRole === "co_lead" ? <span className={`${styles.badge} ${styles.badgeCoLead}`}>Współprowadzisz</span>
            : channel.viewerFollows ? <span className={`${styles.badge} ${styles.badgeFollow}`}>Obserwujesz</span>
            : channel.visibility === "private" ? <span className={`${styles.badge} ${styles.badgePrivate}`}>Prywatny</span>
            : null}
        </div>
      </div>
    </button>
  );
}
