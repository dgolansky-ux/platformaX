/**
 * features-v2/manage/editors/ContactConsentsPanel — Slice 21 (deep dive).
 *
 * Lista zgód kontaktowych: approved + pending + revoked. Każdy item ma
 * working action button (approve / decline / revoke). Stan lokalny mock —
 * approve przenosi z pending do approved, decline z pending do revoked,
 * revoke z approved do revoked. NIE udaje zapisu — re-render natychmiast
 * odzwierciedla zmianę.
 *
 * Reguła: friendship ≠ contact access. Każdy item ma osobny status.
 */
import { useState, type ReactElement } from "react";
import styles from "./Editors.module.css";

export type ConsentStatus = "approved" | "pending" | "revoked";

export interface ConsentItem {
  readonly id: string;
  readonly requesterDisplayName: string;
  readonly requesterHandle: string;
  readonly requestedFields: readonly ("email" | "phone")[];
  readonly status: ConsentStatus;
  readonly requestedAt: string;
}

const DEFAULT_ITEMS: readonly ConsentItem[] = [
  {
    id: "c-1",
    requesterDisplayName: "Anna Kowalska",
    requesterHandle: "anna_k",
    requestedFields: ["email"],
    status: "approved",
    requestedAt: "2026-05-21T10:00:00.000Z",
  },
  {
    id: "c-2",
    requesterDisplayName: "Marek Nowak",
    requesterHandle: "marek_n",
    requestedFields: ["email", "phone"],
    status: "approved",
    requestedAt: "2026-05-12T14:30:00.000Z",
  },
  {
    id: "c-3",
    requesterDisplayName: "Piotr Wiśniewski",
    requesterHandle: "piotr_w",
    requestedFields: ["email"],
    status: "pending",
    requestedAt: "2026-05-29T09:15:00.000Z",
  },
];

const STATUS_LABEL: Record<ConsentStatus, string> = {
  approved: "Zatwierdzone",
  pending: "Oczekuje",
  revoked: "Cofnięte",
};

const STATUS_CLASS: Record<ConsentStatus, string> = {
  approved: styles.statusApproved,
  pending: styles.statusPending,
  revoked: styles.statusRevoked,
};

interface Props {
  initial?: readonly ConsentItem[];
}

export function ContactConsentsPanel({ initial }: Props): ReactElement {
  const [items, setItems] = useState<readonly ConsentItem[]>(initial ?? DEFAULT_ITEMS);

  const updateStatus = (id: string, status: ConsentStatus) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
  };

  const counts = items.reduce(
    (acc, it) => {
      acc[it.status] += 1;
      return acc;
    },
    { approved: 0, pending: 0, revoked: 0 },
  );

  return (
    <section className={styles.panel} aria-labelledby="contact-consents-heading">
      <header className={styles.panelHeader}>
        <h2 id="contact-consents-heading" className={styles.panelTitle}>Zgody kontaktowe</h2>
        <p className={styles.panelLead}>
          Osoby, które poprosiły lub mają dostęp do Twoich danych kontaktowych.
          <strong> Znajomość ≠ dostęp do kontaktu</strong> — każda osoba musi mieć osobną zgodę.
        </p>
        <div className={styles.statsRow}>
          <span className={styles.statPill}>Zatwierdzone: <strong>{counts.approved}</strong></span>
          <span className={styles.statPill}>Oczekujące: <strong>{counts.pending}</strong></span>
          <span className={styles.statPill}>Cofnięte: <strong>{counts.revoked}</strong></span>
        </div>
      </header>

      <ul className={styles.consentList} aria-label="Lista zgód kontaktowych">
        {items.map((it) => (
          <li key={it.id} className={styles.consentItem}>
            <div className={styles.consentBody}>
              <p className={styles.consentName}>
                {it.requesterDisplayName} <span className={styles.consentHandle}>@{it.requesterHandle}</span>
              </p>
              <p className={styles.consentMeta}>
                Pola: {it.requestedFields.join(", ")} · Zgłoszono:{" "}
                {new Date(it.requestedAt).toLocaleDateString("pl-PL")}
              </p>
              <span className={`${styles.consentStatusBadge} ${STATUS_CLASS[it.status]}`}>
                {STATUS_LABEL[it.status]}
              </span>
            </div>
            <div className={styles.consentActions}>
              {it.status === "pending" ? (
                <>
                  <button
                    type="button"
                    className={styles.btnAccept}
                    onClick={() => updateStatus(it.id, "approved")}
                  >
                    Zatwierdź
                  </button>
                  <button
                    type="button"
                    className={styles.btnReject}
                    onClick={() => updateStatus(it.id, "revoked")}
                  >
                    Odrzuć
                  </button>
                </>
              ) : null}
              {it.status === "approved" ? (
                <button
                  type="button"
                  className={styles.btnReject}
                  onClick={() => updateStatus(it.id, "revoked")}
                >
                  Cofnij dostęp
                </button>
              ) : null}
              {it.status === "revoked" ? (
                <button
                  type="button"
                  className={styles.btnAccept}
                  onClick={() => updateStatus(it.id, "approved")}
                >
                  Przywróć
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
