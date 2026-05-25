import styles from "./OnboardingProgress.module.css";

type OnboardingProgressProps = {
  current: number;
  total: number;
  label: string;
};

export function OnboardingProgress({ current, total, label }: OnboardingProgressProps) {
  const pct = Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <div
      className={styles.bar}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label="Postęp onboardingu"
    >
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.labelRow}>
        <span className={styles.current}>{label}</span>
        <span>
          Krok {current} z {total}
        </span>
      </div>
    </div>
  );
}
