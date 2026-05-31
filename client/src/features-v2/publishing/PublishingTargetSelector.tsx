/**
 * features-v2/publishing — PublishingTargetSelector.
 *
 * Renders the Target Publishing Registry. Disabled / partial targets stay
 * visible with a truthful reason so the user never thinks a target is
 * silently missing.
 */
import type {
  PublishingTargetDefinitionUi,
  PublishingTargetTypeUi,
} from "./types";
import styles from "./Publishing.module.css";

interface Props {
  targets: readonly PublishingTargetDefinitionUi[];
  selectedTargetType: PublishingTargetTypeUi;
  selectedTargetId: string | null;
  onChange(target: PublishingTargetDefinitionUi): void;
  disabled?: boolean;
}

function valueOf(t: PublishingTargetDefinitionUi): string {
  return `${t.targetType}|${t.targetId ?? ""}`;
}

export function PublishingTargetSelector({ targets, selectedTargetType, selectedTargetId, onChange, disabled }: Props) {
  const currentValue = `${selectedTargetType}|${selectedTargetId ?? ""}`;
  return (
    <label className={styles.targetRow}>
      <span className={styles.targetLabel}>Gdzie publikujesz?</span>
      <select
        className={styles.targetSelect}
        value={currentValue}
        disabled={disabled}
        onChange={(event) => {
          const next = targets.find((t) => valueOf(t) === event.target.value);
          if (next) onChange(next);
        }}
      >
        {targets.map((t) => (
          <option key={valueOf(t)} value={valueOf(t)} disabled={t.status === "blocked"}>
            {labelFor(t)}
          </option>
        ))}
      </select>
    </label>
  );
}

function labelFor(t: PublishingTargetDefinitionUi): string {
  if (t.status === "available") return t.label;
  if (t.status === "partial") return `${t.label} · w przygotowaniu`;
  if (t.status === "disabled") return `${t.label} · niedostępne`;
  return `${t.label} · brak uprawnień`;
}
