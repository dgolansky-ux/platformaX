/**
 * features-v2/publishing — PublishingSubmitBar.
 *
 * Renders the submit button plus a small body-length counter. Dispatcher
 * enforces the limits server-side; this counter is purely informational.
 */
import type { PublishingTargetDefinitionUi } from "./types";
import styles from "./Publishing.module.css";

interface Props {
  target: PublishingTargetDefinitionUi;
  bodyLength: number;
  disabled: boolean;
  isSubmitting: boolean;
  onSubmit(): void;
  submitLabel?: string;
}

export function PublishingSubmitBar({ target, bodyLength, disabled, isSubmitting, onSubmit, submitLabel }: Props) {
  const remaining = target.maxBodyLength - bodyLength;
  const tooLong = remaining < 0;
  return (
    <div className={styles.submitBar}>
      <span className={styles.submitMeta}>
        {tooLong
          ? `${Math.abs(remaining)} znaków ponad limit`
          : `${remaining} znaków pozostało`}
      </span>
      <button
        type="button"
        className={styles.submitButton}
        disabled={disabled || isSubmitting || tooLong}
        onClick={onSubmit}
      >
        {isSubmitting ? "Publikuję…" : (submitLabel ?? "Opublikuj")}
      </button>
    </div>
  );
}
