/**
 * features-v2/publishing — ComposerTrigger.
 *
 * Slice 20B-FIX FB-style trigger: avatar + pill placeholder on top, separator
 * + action row (Zdjęcie/video · Uczucie/aktywność · Wydarzenie) below. Click
 * anywhere on the trigger (or any of the action chips) opens the composer
 * modal mounted by the caller. The action chips are visual affordances —
 * they all open the same composer; the composer itself owns the actual
 * media/event UX once the modal renders.
 */
import { memo } from "react";
import styles from "./Publishing.module.css";

interface ComposerTriggerProps {
  avatarInitial: string;
  placeholder: string;
  onOpen(): void;
  disabled?: boolean;
}

const TRIGGER_ACTIONS: readonly { icon: string; label: string; key: string }[] = [
  { icon: "🖼️", label: "Zdjęcie/video", key: "media" },
  { icon: "😊", label: "Uczucie/aktywność", key: "feeling" },
  { icon: "📅", label: "Wydarzenie", key: "event" },
];

export const ComposerTrigger = memo(function ComposerTrigger({
  avatarInitial,
  placeholder,
  onOpen,
  disabled,
}: ComposerTriggerProps) {
  return (
    <div className={styles.composerTrigger}>
      <button
        type="button"
        className={styles.composerTriggerTop}
        onClick={onOpen}
        disabled={disabled}
        aria-label={placeholder}
        aria-haspopup="dialog"
      >
        <span className={styles.composerTriggerAvatar} aria-hidden="true">
          {avatarInitial}
        </span>
        <span className={styles.composerTriggerPlaceholder}>{placeholder}</span>
      </button>
      <div className={styles.composerTriggerActions}>
        {TRIGGER_ACTIONS.map((a) => (
          <button
            key={a.key}
            type="button"
            className={styles.composerTriggerAction}
            onClick={onOpen}
            disabled={disabled}
          >
            <span className={styles.composerTriggerActionIcon} aria-hidden="true">{a.icon}</span>
            <span className={styles.composerTriggerActionLabel}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});
