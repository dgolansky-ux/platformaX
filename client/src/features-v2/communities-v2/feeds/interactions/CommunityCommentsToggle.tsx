/**
 * features-v2/communities-v2 / feeds / interactions / CommunityCommentsToggle
 *
 * Subtle "N komentarzy" button that expands/collapses the comments thread.
 * Renders a real count from the adapter — never a placeholder zero.
 */
import styles from "./Interactions.module.css";

type Props = {
  count: number;
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

function commentLabel(count: number, open: boolean): string {
  if (open) return "Zwiń komentarze";
  if (count === 0) return "Skomentuj";
  if (count === 1) return "1 komentarz";
  return `${count} komentarzy`;
}

export function CommunityCommentsToggle({ count, open, onToggle, disabled }: Props) {
  return (
    <button
      type="button"
      className={styles.action}
      onClick={onToggle}
      disabled={disabled}
      aria-expanded={open}
    >
      <span className={styles.actionIcon} aria-hidden="true">💬</span>
      <span>{commentLabel(count, open)}</span>
    </button>
  );
}
