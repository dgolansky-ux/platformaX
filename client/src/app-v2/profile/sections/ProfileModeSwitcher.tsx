import type { ProfileViewMode } from "../types";
import styles from "../profile.module.css";

type ProfileModeSwitcherProps = {
  mode: ProfileViewMode;
  onSelectPersonal: () => void;
  onSelectProfessional: () => void;
};

/**
 * Osobisty / Zawodowy switch. Both are modes of the SAME profile — switching is
 * local view state, not a separate route/domain. Gesture swipe is
 * GESTURE_PENDING — the hint + buttons are present.
 */
export function ProfileModeSwitcher({
  mode,
  onSelectPersonal,
  onSelectProfessional,
}: ProfileModeSwitcherProps) {
  return (
    <>
      <div className={styles.switcherRow}>
        <div className={styles.switcher} role="tablist" aria-label="Tryb profilu">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "personal"}
            className={`${styles.switcherButton} ${mode === "personal" ? styles.switcherButtonActive : ""}`}
            onClick={onSelectPersonal}
          >
            Osobisty
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "professional"}
            className={`${styles.switcherButton} ${mode === "professional" ? styles.switcherButtonActive : ""}`}
            onClick={onSelectProfessional}
          >
            Zawodowy
          </button>
        </div>
      </div>
      <p className={styles.swipeHint}>👆 Przesuń w lewo/prawo aby zmienić tryb</p>
    </>
  );
}
