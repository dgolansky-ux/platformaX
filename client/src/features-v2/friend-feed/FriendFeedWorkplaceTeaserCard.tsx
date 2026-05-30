/**
 * features-v2/friend-feed / FriendFeedWorkplaceTeaserCard.
 *
 * The mini-card that surfaces a workplace post on the friend feed. Visually
 * smaller and structurally different from `FriendFeedPostCard`: it carries
 * a short preview only and links to the full workplace post (no inline
 * reactions, no comments, no full body).
 */
import type { FriendFeedWorkplaceTeaserItemUi } from "./types";
import styles from "./FriendFeedWorkplaceTeaserCard.module.css";

type Props = {
  item: FriendFeedWorkplaceTeaserItemUi;
  onOpen?: (route: string) => void;
};

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function FriendFeedWorkplaceTeaserCard({ item, onOpen }: Props) {
  const { teaser, owner } = item;
  return (
    <li className={styles.teaserCard} data-testid="friend-feed-workplace-teaser">
      <header className={styles.teaserHeader}>
        <span className={styles.teaserAvatar} aria-hidden="true">{initials(owner.displayName)}</span>
        <div className={styles.teaserMeta}>
          <p className={styles.teaserAuthor}>
            {owner.displayName} · {teaser.workplaceName}
          </p>
          <p className={styles.teaserDate}>{formatDate(teaser.createdAt)}</p>
        </div>
        <span className={styles.teaserChip}>Z miejsca pracy</span>
      </header>
      <p className={styles.teaserPreview}>{teaser.previewText}</p>
      <footer className={styles.teaserFooter}>
        <button
          type="button"
          className={styles.teaserCta}
          onClick={() => onOpen?.(teaser.targetRoute)}
          disabled={!onOpen}
        >
          Zobacz wpis
        </button>
      </footer>
    </li>
  );
}
