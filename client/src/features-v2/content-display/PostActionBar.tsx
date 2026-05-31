/**
 * features-v2/content-display — PostActionBar.
 *
 * Facebook-style action bar: equal-width buttons separated from the body by
 * a thin top rule. Labels read "Lubię to", "Komentarz", "Udostępnij" — counts
 * live in PostStatsRow above the bar, not on the buttons. Each button stays
 * an accessible <button>; the route link keeps its existing anchor contract.
 */
import { memo } from "react";
import type {
  PostDisplayActionBarConfig,
  PostDisplayInteractionSummary,
} from "./types";
import styles from "./ContentDisplay.module.css";

interface ActionBarProps {
  config: PostDisplayActionBarConfig;
  interaction?: PostDisplayInteractionSummary;
  routeTarget: string;
  onReact?(): void;
  onComment?(): void;
  onShare?(): void;
}

export const PostActionBar = memo(function PostActionBar({ config, interaction, routeTarget, onReact, onComment, onShare }: ActionBarProps) {
  const liked = interaction?.viewerLiked ?? false;
  return (
    <div className={styles.actionBar}>
      {config.showReact && (
        <button
          type="button"
          className={styles.actionButton}
          aria-pressed={liked}
          onClick={onReact}
          disabled={!interaction?.viewerCanReact}
        >
          <span className={styles.actionButtonIcon} aria-hidden="true">{liked ? "💙" : "👍"}</span>
          <span className={styles.actionButtonLabel}>{liked ? "Lubisz to" : "Lubię to"}</span>
          {interaction && interaction.likeCount > 0 ? <span aria-label={`Liczba reakcji: ${interaction.likeCount}`}>· {interaction.likeCount}</span> : null}
        </button>
      )}
      {config.showComment && (
        <button
          type="button"
          className={styles.actionButton}
          onClick={onComment}
          disabled={!interaction?.viewerCanComment}
        >
          <span className={styles.actionButtonIcon} aria-hidden="true">💬</span>
          <span className={styles.actionButtonLabel}>Komentarz</span>
          {interaction && interaction.commentCount > 0 ? <span aria-label={`Liczba komentarzy: ${interaction.commentCount}`}>· {interaction.commentCount}</span> : null}
        </button>
      )}
      {config.showShare && (
        <button type="button" className={styles.actionButton} onClick={onShare}>
          <span className={styles.actionButtonIcon} aria-hidden="true">↗️</span>
          <span className={styles.actionButtonLabel}>Udostępnij</span>
        </button>
      )}
      {config.showOpen && (
        <PostRouteLink href={routeTarget}>Otwórz</PostRouteLink>
      )}
    </div>
  );
});

export function PostRouteLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className={styles.actionLink} href={href}>{children}</a>;
}
