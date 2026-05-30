/**
 * features-v2/publishing — PublishingVisibilitySelector.
 *
 * Renders only the visibilities the current target allows; the dispatcher
 * re-checks server-side so a tampered client cannot bypass the rule.
 */
import type {
  PublishingTargetDefinitionUi,
  PublishingVisibilityUi,
} from "./types";
import styles from "./Publishing.module.css";

interface Props {
  target: PublishingTargetDefinitionUi;
  value: PublishingVisibilityUi;
  onChange(next: PublishingVisibilityUi): void;
  disabled?: boolean;
}

export function PublishingVisibilitySelector({ target, value, onChange, disabled }: Props) {
  return (
    <label className={styles.targetRow}>
      <span className={styles.targetLabel}>Widoczność</span>
      <select
        className={styles.visibilitySelect}
        value={value}
        disabled={disabled || target.visibilityOptions.length <= 1}
        onChange={(event) => onChange(event.target.value as PublishingVisibilityUi)}
      >
        {target.visibilityOptions.map((v) => (
          <option key={v} value={v}>{labelFor(v)}</option>
        ))}
      </select>
    </label>
  );
}

function labelFor(v: PublishingVisibilityUi): string {
  switch (v) {
    case "friends_only": return "Tylko znajomi";
    case "public": return "Publiczne";
    case "private": return "Prywatne";
    case "community_all": return "Cała społeczność";
    case "community_staff": return "Tylko kadra";
    case "community_relational": return "Relacyjne";
    case "channel_followers": return "Obserwujący kanał";
    case "workplace_public": return "Miejsce pracy — publiczne";
    case "workplace_friends_only": return "Miejsce pracy — znajomi";
    case "workplace_private": return "Miejsce pracy — prywatne";
    case "profile_owner_chosen": return "Wg ustawień profilu";
  }
}
