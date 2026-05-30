/**
 * features-v2/publishing — ComposerTrigger.
 *
 * Compact, social-feeling card that replaces the heavy inline composer on
 * feed surfaces. Click anywhere on the trigger opens the composer modal
 * (mounted by the caller).
 */
import { memo } from "react";
import styles from "./Publishing.module.css";

interface ComposerTriggerProps {
  avatarInitial: string;
  placeholder: string;
  onOpen(): void;
  disabled?: boolean;
  /** Optional inline icons rendered on the right (photo, event, etc.). */
  inlineActions?: React.ReactNode;
}

export const ComposerTrigger = memo(function ComposerTrigger({
  avatarInitial,
  placeholder,
  onOpen,
  disabled,
  inlineActions,
}: ComposerTriggerProps) {
  return (
    <button
      type="button"
      className={styles.composerTrigger}
      onClick={onOpen}
      disabled={disabled}
      aria-label={placeholder}
      aria-haspopup="dialog"
    >
      <span className={styles.composerTriggerAvatar} aria-hidden="true">
        {avatarInitial}
      </span>
      <span className={styles.composerTriggerPlaceholder}>{placeholder}</span>
      {inlineActions ? (
        <span
          className={styles.composerTriggerActions}
          onClick={(event) => event.stopPropagation()}
        >
          {inlineActions}
        </span>
      ) : null}
    </button>
  );
});
