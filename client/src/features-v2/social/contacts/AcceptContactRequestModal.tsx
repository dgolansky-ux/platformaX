import { useState, type ReactElement } from "react";
import type {
  ApprovedContactField,
  ContactRequest,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import { APPROVED_CONTACT_FIELDS } from "@shared/contracts/contacts";
import styles from "./AcceptContactRequestModal.module.css";

const FIELD_LABELS: Record<ApprovedContactField, string> = {
  phone: "Telefon",
  emailContact: "Email",
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  linkedin: "LinkedIn",
  website: "Strona WWW",
};

export type AcceptContactRequestModalProps = {
  request: ContactRequest;
  viewerId: UserId;
  onClose: () => void;
  onSubmit: (
    approvedFields: readonly ApprovedContactField[],
  ) => Promise<void> | void;
};

export function AcceptContactRequestModal({
  request,
  viewerId,
  onClose,
  onSubmit,
}: AcceptContactRequestModalProps): ReactElement {
  const [selected, setSelected] = useState<Set<ApprovedContactField>>(new Set());
  const toggle = (field: ApprovedContactField) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };
  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Wybierz pola do udostępnienia"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.title}>Wybierz pola do udostępnienia</h2>
        <p className={styles.caption}>
          Akceptujesz prośbę od {request.fromUserId}. Możesz nie wybrać
          żadnego pola — wtedy zatwierdzenie nie udostępnia nic.
        </p>
        <fieldset className={styles.fields}>
          <legend className={styles.legend}>Pola kontaktowe</legend>
          {APPROVED_CONTACT_FIELDS.map((field) => (
            <label key={field} className={styles.checkbox}>
              <input
                type="checkbox"
                checked={selected.has(field)}
                onChange={() => toggle(field)}
              />
              <span>{FIELD_LABELS[field]}</span>
            </label>
          ))}
        </fieldset>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btn}
            onClick={onClose}
          >
            Anuluj
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => onSubmit([...selected])}
          >
            Zatwierdź
          </button>
        </div>
        <p className={styles.note}>
          Przypomnienie: nawet zatwierdzone pole będzie widoczne tylko jeśli
          masz dla niego włączone „Zatwierdzeni widzą” w ustawieniach
          prywatności. Viewer: {viewerId}.
        </p>
      </div>
    </div>
  );
}
