/**
 * features-v2/media — BrokenMediaFallback.
 *
 * Graceful display-kit placeholder for a missing or unreachable asset URL.
 * Never invents a remote URL — just renders a calm, readable placeholder.
 */
import styles from "./Media.module.css";

interface Props {
  label?: string;
}

export function BrokenMediaFallback({ label = "Brak podglądu" }: Props) {
  return (
    <div className={styles.brokenFallback} role="img" aria-label={label}>
      <span aria-hidden="true">🖼️</span>
      <span style={{ marginLeft: "0.375rem" }}>{label}</span>
    </div>
  );
}
