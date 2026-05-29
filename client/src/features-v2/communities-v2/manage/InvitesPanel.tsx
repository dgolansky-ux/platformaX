/**
 * features-v2/communities-v2/manage / InvitesPanel
 *
 * Founder/admin-only invites foundation. Slice 3: the mock adapter records
 * invites in memory and exposes a manage DTO with `invitedEmail`. No email
 * delivery happens (status notes that explicitly — TRANSPORT_PARTIAL).
 */
import { useState } from "react";
import type { CommunityInviteSummaryDTO } from "@shared/contracts/communities-viewer";
import styles from "../CommunityManage.module.css";

export type InvitesPanelProps = {
  invites: readonly CommunityInviteSummaryDTO[];
  onCreate: (input: { invitedUserId?: string; invitedEmail?: string }) => Promise<void>;
  onCancel: (inviteId: string) => Promise<void>;
};

const STATUS_LABEL: Record<CommunityInviteSummaryDTO["status"], string> = {
  pending: "Oczekuje",
  accepted: "Zaakceptowane",
  cancelled: "Anulowane",
  expired: "Wygasłe",
};

const STATUS_CLASS_MAP: Record<CommunityInviteSummaryDTO["status"], string> = {
  pending: styles.inviteStatusPending,
  accepted: styles.inviteStatusBadge,
  cancelled: styles.inviteStatusCancelled,
  expired: styles.inviteStatusCancelled,
};

export function InvitesPanel({ invites, onCreate, onCancel }: InvitesPanelProps) {
  const [userIdInput, setUserIdInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    await onCreate({
      invitedUserId: userIdInput.trim() || undefined,
      invitedEmail: emailInput.trim() || undefined,
    });
    setPending(false);
    setUserIdInput("");
    setEmailInput("");
  };

  return (
    <section className={styles.panel} aria-labelledby="invites-heading">
      <h2 id="invites-heading" className={styles.panelTitle}>Zaproszenia ({invites.length})</h2>
      <form className={styles.inviteForm} onSubmit={(e) => void handleSubmit(e)}>
        <label className={`${styles.field} ${styles.inviteField}`}>
          <span className={styles.label}>userId</span>
          <input
            className={styles.input}
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            placeholder="np. u-anna-pm"
          />
        </label>
        <label className={`${styles.field} ${styles.inviteField}`}>
          <span className={styles.label}>lub email</span>
          <input
            type="email"
            className={styles.input}
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="osoba@example.com"
          />
        </label>
        <button type="submit" className={styles.primaryButton} disabled={pending}>
          {pending ? "Wysyłanie..." : "Wyślij zaproszenie"}
        </button>
      </form>
      <p className={styles.transportNote}>
        TRANSPORT_PARTIAL: zaproszenie jest rejestrowane, ale e-mail nie zostaje wysłany w tym etapie.
      </p>
      {invites.length === 0 ? (
        <p className={styles.empty}>Brak zaproszeń.</p>
      ) : (
        <ul className={styles.list}>
          {invites.map((invite) => (
            <li key={invite.id} className={styles.listItem}>
              <div>
                <p className={styles.listItemTitle}>
                  {invite.invitedUserId ? `userId: ${invite.invitedUserId}` : invite.invitedEmail ?? "—"}
                </p>
                <p className={styles.listItemMeta}>
                  Wysłano: {new Date(invite.createdAt).toLocaleDateString("pl-PL")}
                </p>
              </div>
              <div className={styles.listItemActions}>
                <span className={STATUS_CLASS_MAP[invite.status]}>{STATUS_LABEL[invite.status]}</span>
                {invite.status === "pending" ? (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => void onCancel(invite.id)}
                  >
                    Anuluj
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
