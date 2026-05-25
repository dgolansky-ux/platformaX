import type { ProfileViewMode } from "../types";
import styles from "../profile.module.css";

type ProfileModeSwitcherProps = {
  mode: ProfileViewMode;
  onSelectPersonal: () => void;
};

/**
 * Osobisty / Zawodowy switch. This PR ships the personal layer only, so the
 * professional option is a disabled-policy state (not a separate route/domain).
 * Gesture swipe is GESTURE_PENDING — the hint + buttons are present.
 */
export function ProfileModeSwitcher({
  mode,
  onSelectPersonal,
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
            aria-selected={false}
            className={styles.switcherButton}
            title="Profil zawodowy będzie dostępny w kolejnym etapie"
            disabled
          >
            Zawodowy
          </button>
        </div>
      </div>
      <p className={styles.swipeHint}>👆 Przesuń w lewo/prawo aby zmienić tryb</p>
    </>
  );
}
