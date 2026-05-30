/**
 * features-v2/content-display — PostActionBar.
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
  return (
    <div className={styles.actionBar}>
      {config.showReact && (
        <button
          type="button"
          className={styles.actionButton}
          aria-pressed={interaction?.viewerLiked ?? false}
          onClick={onReact}
          disabled={!interaction?.viewerCanReact}
        >
          👍 <span>{interaction?.likeCount ?? 0}</span>
        </button>
      )}
      {config.showComment && (
        <button
          type="button"
          className={styles.actionButton}
          onClick={onComment}
          disabled={!interaction?.viewerCanComment}
        >
          💬 <span>{interaction?.commentCount ?? 0}</span>
        </button>
      )}
      {config.showShare && (
        <button type="button" className={styles.actionButton} onClick={onShare}>
          🔗 <span>Udostępnij</span>
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
