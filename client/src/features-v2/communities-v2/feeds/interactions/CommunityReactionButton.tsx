/**
 * features-v2/communities-v2 / feeds / interactions / CommunityReactionButton
 *
 * Toggles a "like" on a community feed item or comment via the
 * community-interactions mock adapter. NO optimistic UI in the MVP — the
 * caller passes a callback that refreshes summary state from the adapter
 * after the action succeeds. Disabled state covers permission gating.
 */
import styles from "./Interactions.module.css";

type Props = {
  active: boolean;
  count: number;
  onToggle: () => void;
  disabled?: boolean;
  busy?: boolean;
  /** ARIA label for screenreaders ("Polub", "Polubiono"). */
  ariaLabel: string;
  testId?: string;
};

export function CommunityReactionButton({ active, count, onToggle, disabled, busy, ariaLabel, testId }: Props) {
  return (
    <button
      type="button"
      className={`${styles.action} ${active ? styles.actionActive : ""}`}
      onClick={onToggle}
      disabled={Boolean(disabled || busy)}
      aria-pressed={active}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      <span className={styles.actionIcon} aria-hidden="true">{active ? "♥" : "♡"}</span>
      <span>{active ? "Polubiono" : "Polub"}</span>
      {count > 0 ? <span className={styles.actionCount}>· {count}</span> : null}
    </button>
  );
}
