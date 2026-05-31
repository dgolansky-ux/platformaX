/**
 * features-v2/publishing — ComposerModal.
 *
 * Modal/sheet wrapper around any composer variant. The variant content is
 * passed in as children so the wrapper stays composer-agnostic. Pressing
 * Escape or the close button closes the modal; pressing outside the dialog
 * body does NOT close it (the composer holds unsaved content).
 */
import { memo, useEffect } from "react";
import styles from "./Publishing.module.css";

interface ComposerModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose(): void;
  children: React.ReactNode;
}

export const ComposerModal = memo(function ComposerModal({
  open,
  title,
  subtitle,
  onClose,
  children,
}: ComposerModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.composerModalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="composer-modal-title"
    >
      <div className={styles.composerModal}>
        <header className={styles.composerModalHeader}>
          <div>
            <h2 id="composer-modal-title" className={styles.composerModalTitle}>
              {title}
            </h2>
            {subtitle ? (
              <p className={styles.composerModalSubtitle}>{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.composerModalClose}
            aria-label="Zamknij okno publikacji"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className={styles.composerModalBody}>{children}</div>
      </div>
    </div>
  );
});
