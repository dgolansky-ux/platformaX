import { useState, type ReactElement } from "react";
import type { ContactPersonSummary } from "@shared/contracts/contacts";
import styles from "./AcceptContactRequestModal.module.css";

export type ContactRequestModalProps = {
  target: ContactPersonSummary;
  onClose: () => void;
  onSubmit: (input: { message: string; purpose?: string }) => Promise<void> | void;
};

/**
 * Sender-side modal for the contact-request flow: compose a short message
 * (and optional purpose). Submitting only ASKS — it never reveals any field;
 * the receiver chooses what to share via the grant modal.
 */
export function ContactRequestModal({
  target,
  onClose,
  onSubmit,
}: ContactRequestModalProps): ReactElement {
  const [message, setMessage] = useState("");
  const [purpose, setPurpose] = useState("");
  const canSend = message.trim().length > 0;
  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={`Poproś o kontakt: ${target.displayName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.title}>Poproś o kontakt</h2>
        <p className={styles.caption}>
          Wyślij prośbę do {target.displayName}. To tylko prośba — {target.displayName}{" "}
          zdecyduje, które dane kontaktowe udostępnić.
        </p>
        <fieldset className={styles.fields}>
          <legend className={styles.legend}>Wiadomość</legend>
          <textarea
            className={styles.checkbox}
            rows={3}
            value={message}
            placeholder="Cześć! Chciał(a)bym nawiązać kontakt w sprawie…"
            onChange={(e) => setMessage(e.target.value)}
            aria-label="Treść wiadomości"
          />
          <input
            type="text"
            value={purpose}
            placeholder="Cel (opcjonalnie), np. Współpraca"
            onChange={(e) => setPurpose(e.target.value)}
            aria-label="Cel prośby"
          />
        </fieldset>
        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={onClose}>
            Anuluj
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={!canSend}
            onClick={() =>
              onSubmit({ message: message.trim(), purpose: purpose.trim() || undefined })
            }
          >
            Wyślij prośbę
          </button>
        </div>
        <p className={styles.note}>
          Wysłanie prośby nie ujawnia żadnych Twoich danych drugiej stronie.
        </p>
      </div>
    </div>
  );
}
